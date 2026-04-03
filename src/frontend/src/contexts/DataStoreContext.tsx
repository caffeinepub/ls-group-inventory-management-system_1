/**
 * Central data store backed by the Internet Computer canister.
 * All app data is shared across users and devices via the backend.
 * Polls every 10 seconds for updates from other users/devices.
 *
 * Race condition fix: pending writes per field prevent polling from
 * overwriting optimistic local updates while a write is in flight.
 */

import { createActorWithConfig } from "@/config";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Backend interface ──────────────────────────────────────────────────────────────
interface JsonBackend {
  getAllData(): Promise<
    [string, string, string, string, string, string, string, string, string]
  >;
  getInventory(): Promise<string>;
  setInventory(data: string): Promise<void>;
  getBardana(): Promise<string>;
  setBardana(data: string): Promise<void>;
  getOrders(): Promise<string>;
  setOrders(data: string): Promise<void>;
  getTools(): Promise<string>;
  setTools(data: string): Promise<void>;
  getRawMaterials(): Promise<string>;
  setRawMaterials(data: string): Promise<void>;
  getChangeLogInventory(): Promise<string>;
  setChangeLogInventory(data: string): Promise<void>;
  getChangeLogBardana(): Promise<string>;
  setChangeLogBardana(data: string): Promise<void>;
  getTransactionLog(): Promise<string>;
  setTransactionLog(data: string): Promise<void>;
  getUsers(): Promise<string>;
  setUsers(data: string): Promise<void>;
}

// ─── Types ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "staff";

export interface User {
  username: string;
  password: string;
  role: UserRole;
  blocked?: boolean;
}

export interface PlantData {
  quantities: Record<string, number>;
  customProducts: string[];
  deletedBuiltins: string[];
  productOrder: string[];
}

export interface BardanaEntry {
  initialStock: number;
  stockInWH: number;
  addedBardana: number;
  accumulatedInventory: number;
}

export interface BardanaPlantMeta {
  customProducts: string[];
  deletedBuiltins: string[];
  productOrder: string[];
}

export interface BardanaStoreData {
  entries: Record<string, BardanaEntry>;
  plantMeta: Record<string, BardanaPlantMeta>;
}

export interface DeliveryRecord {
  id: string;
  date: string;
  deliveredBags: string;
  brand: string;
  remarks: string;
  createdAt: number;
}

export interface OrderRecord {
  id: string;
  date: string;
  orderedBags: string;
  brand: string;
  rate: string;
  partyName: string;
  dalalName: string;
  remarks: string;
  deliveries: DeliveryRecord[];
  createdAt: number;
}

export interface ToolRecord {
  id: string;
  plant: string;
  product: string;
  quantity: string;
  remarks: string;
  createdAt: number;
}

export interface InventoryLogEntry {
  id: string;
  timestamp: number;
  plant: string;
  product: string;
  qtyChange: number;
  userId: string;
}

export interface BardanaLogEntry {
  id: string;
  timestamp: number;
  plant: string;
  product: string;
  column: string;
  previousQty: number;
  newQty: number;
  userId: string;
}

export interface TransactionEntry {
  id: string;
  plant: string;
  product: string;
  type: "add" | "subtract";
  quantity: number;
  timestamp: number;
}

export type InventoryData = Record<string, PlantData>;

// ─── Defaults ──────────────────────────────────────────────────────────────────────────

export const DEFAULT_USERS: User[] = [
  { username: "akshay", password: "lsgroup", role: "admin" },
  { username: "harshul", password: "lsgroup", role: "admin" },
  { username: "ashok", password: "lsgroup", role: "admin" },
  { username: "chandan", password: "lsgroup", role: "admin" },
  { username: "ashish", password: "lsgroup", role: "admin" },
];

const EMPTY_BARDANA_STORE: BardanaStoreData = { entries: {}, plantMeta: {} };

// Field indices matching the getAllData() tuple order
const FIELD_INVENTORY = 0;
const FIELD_BARDANA = 1;
const FIELD_ORDERS = 2;
const FIELD_TOOLS = 3;
const FIELD_RAW_MATERIALS = 4;
const FIELD_CHANGELOG_INVENTORY = 5;
const FIELD_CHANGELOG_BARDANA = 6;
const FIELD_TRANSACTION_LOG = 7;
const FIELD_USERS = 8;

// ─── Backend singleton (lazy) ──────────────────────────────────────────────────────────

let cachedActor: JsonBackend | null = null;
let actorPromise: Promise<JsonBackend> | null = null;

async function getActor(): Promise<JsonBackend> {
  if (cachedActor) return cachedActor;
  if (actorPromise) return actorPromise;
  actorPromise = createActorWithConfig().then((actor) => {
    cachedActor = actor as unknown as JsonBackend;
    return cachedActor;
  });
  return actorPromise;
}

// ─── Context ─────────────────────────────────────────────────────────────────────────────

interface DataStoreValue {
  isLoading: boolean;
  inventoryData: InventoryData;
  bardanaData: BardanaStoreData;
  rawMaterialsData: InventoryData;
  ordersData: OrderRecord[];
  toolsData: ToolRecord[];
  changeLogInventory: InventoryLogEntry[];
  changeLogBardana: BardanaLogEntry[];
  transactionLog: TransactionEntry[];
  users: User[];
  updateInventoryData: (data: InventoryData) => void;
  updateBardanaData: (data: BardanaStoreData) => void;
  updateRawMaterialsData: (data: InventoryData) => void;
  updateOrdersData: (data: OrderRecord[]) => void;
  updateToolsData: (data: ToolRecord[]) => void;
  updateChangeLogInventory: (data: InventoryLogEntry[]) => void;
  updateChangeLogBardana: (data: BardanaLogEntry[]) => void;
  updateTransactionLog: (data: TransactionEntry[]) => void;
  updateUsers: (data: User[]) => void;
}

const DataStoreContext = createContext<DataStoreValue | null>(null);

// ─── Helpers ───────────────────────────────────────────────────────────────────────────

function parseOrDefault<T>(json: string, fallback: T): T {
  if (!json || json === "null" || json === '""' || json.trim() === "")
    return fallback;
  try {
    const parsed = JSON.parse(json);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function normalizeBardanaStore(raw: unknown): BardanaStoreData {
  if (!raw || typeof raw !== "object") return EMPTY_BARDANA_STORE;
  const r = raw as Record<string, unknown>;
  return {
    entries: (r.entries && typeof r.entries === "object"
      ? r.entries
      : {}) as Record<string, BardanaEntry>,
    plantMeta: (r.plantMeta && typeof r.plantMeta === "object"
      ? r.plantMeta
      : {}) as Record<string, BardanaPlantMeta>,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────────────────

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryData>({});
  const [bardanaData, setBardanaData] =
    useState<BardanaStoreData>(EMPTY_BARDANA_STORE);
  const [rawMaterialsData, setRawMaterialsData] = useState<InventoryData>({});
  const [ordersData, setOrdersData] = useState<OrderRecord[]>([]);
  const [toolsData, setToolsData] = useState<ToolRecord[]>([]);
  const [changeLogInventory, setChangeLogInventory] = useState<
    InventoryLogEntry[]
  >([]);
  const [changeLogBardana, setChangeLogBardana] = useState<BardanaLogEntry[]>(
    [],
  );
  const [transactionLog, setTransactionLog] = useState<TransactionEntry[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);

  // Last known JSON from the backend (for change detection)
  const lastJsonRef = useRef<string[]>(Array(9).fill(""));

  // Pending writes counter per field — prevents polling from overwriting
  // optimistic updates while a backend write is still in flight.
  const pendingWritesRef = useRef<number[]>(Array(9).fill(0));

  const applyAllData = useCallback(
    (
      data: [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ],
    ) => {
      const [inv, bard, orders, tools, raw, clInv, clBard, txn, usr] = data;

      setInventoryData(parseOrDefault<InventoryData>(inv, {}));
      setBardanaData(normalizeBardanaStore(parseOrDefault<unknown>(bard, {})));
      setRawMaterialsData(parseOrDefault<InventoryData>(raw, {}));
      setOrdersData(parseOrDefault<OrderRecord[]>(orders, []));
      setToolsData(parseOrDefault<ToolRecord[]>(tools, []));
      setChangeLogInventory(parseOrDefault<InventoryLogEntry[]>(clInv, []));
      setChangeLogBardana(parseOrDefault<BardanaLogEntry[]>(clBard, []));
      setTransactionLog(parseOrDefault<TransactionEntry[]>(txn, []));

      const parsedUsers = parseOrDefault<User[]>(usr, []);
      setUsers(parsedUsers.length > 0 ? parsedUsers : DEFAULT_USERS);
    },
    [],
  );

  // Initial load
  useEffect(() => {
    getActor()
      .then((actor) => actor.getAllData())
      .then((data) => {
        lastJsonRef.current = [...data];
        applyAllData(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [applyAllData]);

  // Poll every 10 seconds for updates from other users/devices.
  // Fields with pending writes are skipped to avoid reverting optimistic updates.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const actor = await getActor();
        const data = await actor.getAllData();

        // Build merged data: skip fields with pending writes (keep local value)
        const merged = data.map((json, i) =>
          pendingWritesRef.current[i] > 0 ? lastJsonRef.current[i] : json,
        ) as typeof data;

        const hasChanged = merged.some(
          (json, i) => json !== lastJsonRef.current[i],
        );
        if (hasChanged) {
          lastJsonRef.current = [...merged];
          applyAllData(merged);
        }
      } catch {
        // silently ignore polling errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [applyAllData]);

  // ─── Updater factory ────────────────────────────────────────────────────────────
  // Each updater:
  // 1. Updates React state immediately (optimistic)
  // 2. Increments pending-writes counter for this field
  // 3. Writes to backend
  // 4. On completion (success or error), decrements pending-writes counter
  //
  // While pending > 0, the polling loop skips this field so it cannot
  // overwrite the optimistic update with stale backend data.

  function makeUpdater<T>(
    fieldIndex: number,
    setter: React.Dispatch<React.SetStateAction<T>>,
    backendWrite: (actor: JsonBackend, json: string) => Promise<void>,
  ) {
    return (data: T) => {
      setter(data);
      const json = JSON.stringify(data);
      lastJsonRef.current[fieldIndex] = json;
      pendingWritesRef.current[fieldIndex]++;
      getActor()
        .then((a) => backendWrite(a, json))
        .catch(() => {})
        .finally(() => {
          pendingWritesRef.current[fieldIndex]--;
        });
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateInventoryData = useCallback(
    makeUpdater<InventoryData>(FIELD_INVENTORY, setInventoryData, (a, json) =>
      a.setInventory(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateBardanaData = useCallback(
    makeUpdater<BardanaStoreData>(FIELD_BARDANA, setBardanaData, (a, json) =>
      a.setBardana(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateRawMaterialsData = useCallback(
    makeUpdater<InventoryData>(
      FIELD_RAW_MATERIALS,
      setRawMaterialsData,
      (a, json) => a.setRawMaterials(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateOrdersData = useCallback(
    makeUpdater<OrderRecord[]>(FIELD_ORDERS, setOrdersData, (a, json) =>
      a.setOrders(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateToolsData = useCallback(
    makeUpdater<ToolRecord[]>(FIELD_TOOLS, setToolsData, (a, json) =>
      a.setTools(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateChangeLogInventory = useCallback(
    makeUpdater<InventoryLogEntry[]>(
      FIELD_CHANGELOG_INVENTORY,
      setChangeLogInventory,
      (a, json) => a.setChangeLogInventory(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateChangeLogBardana = useCallback(
    makeUpdater<BardanaLogEntry[]>(
      FIELD_CHANGELOG_BARDANA,
      setChangeLogBardana,
      (a, json) => a.setChangeLogBardana(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateTransactionLog = useCallback(
    makeUpdater<TransactionEntry[]>(
      FIELD_TRANSACTION_LOG,
      setTransactionLog,
      (a, json) => a.setTransactionLog(json),
    ),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateUsers = useCallback(
    makeUpdater<User[]>(FIELD_USERS, setUsers, (a, json) => a.setUsers(json)),
    [],
  );

  return (
    <DataStoreContext.Provider
      value={{
        isLoading,
        inventoryData,
        bardanaData,
        rawMaterialsData,
        ordersData,
        toolsData,
        changeLogInventory,
        changeLogBardana,
        transactionLog,
        users,
        updateInventoryData,
        updateBardanaData,
        updateRawMaterialsData,
        updateOrdersData,
        updateToolsData,
        updateChangeLogInventory,
        updateChangeLogBardana,
        updateTransactionLog,
        updateUsers,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx)
    throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
