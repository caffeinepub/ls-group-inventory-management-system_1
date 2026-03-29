/**
 * Central data store backed by the Internet Computer canister.
 * All app data is shared across users and devices via the backend.
 * Polls every 10 seconds for updates from other users/devices.
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

// ─── New backend JSON API interface ───────────────────────────────────────
// This matches src/frontend/src/backend.d.ts
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "staff";

export interface User {
  username: string;
  password: string;
  role: UserRole;
  blocked?: boolean;
}

/** Per-plant data for inventory and raw materials */
export interface PlantData {
  quantities: Record<string, number>;
  customProducts: string[];
  deletedBuiltins: string[];
  productOrder: string[];
}

/** Per-product per-plant bardana calculation entry */
export interface BardanaEntry {
  initialStock: number;
  stockInWH: number;
  addedBardana: number;
  accumulatedInventory: number;
}

/** Per-plant metadata for bardana product list */
export interface BardanaPlantMeta {
  customProducts: string[];
  deletedBuiltins: string[];
  productOrder: string[];
}

/** Full bardana store structure */
export interface BardanaStoreData {
  entries: Record<string, BardanaEntry>; // key = `${plant}__${product}`
  plantMeta: Record<string, BardanaPlantMeta>; // key = plant name
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

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_USERS: User[] = [
  { username: "akshay", password: "lsgroup", role: "admin" },
  { username: "harshul", password: "lsgroup", role: "admin" },
  { username: "ashok", password: "lsgroup", role: "admin" },
  { username: "chandan", password: "lsgroup", role: "admin" },
  { username: "ashish", password: "lsgroup", role: "admin" },
];

const EMPTY_BARDANA_STORE: BardanaStoreData = { entries: {}, plantMeta: {} };

// ─── Backend singleton (lazy) ──────────────────────────────────────────────────

let cachedActor: JsonBackend | null = null;
let actorPromise: Promise<JsonBackend> | null = null;

async function getActor(): Promise<JsonBackend> {
  if (cachedActor) return cachedActor;
  if (actorPromise) return actorPromise;
  actorPromise = createActorWithConfig().then((actor) => {
    // Cast to new JSON-based interface (backend.d.ts)
    cachedActor = actor as unknown as JsonBackend;
    return cachedActor;
  });
  return actorPromise;
}

// ─── Context ──────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Provider ─────────────────────────────────────────────────────────────────

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

  // Track last known JSON for smart polling
  const lastJsonRef = useRef<string[]>(Array(9).fill(""));

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

  // Poll every 10 seconds for updates from other users/devices
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const actor = await getActor();
        const data = await actor.getAllData();
        const hasChanged = data.some(
          (json, i) => json !== lastJsonRef.current[i],
        );
        if (hasChanged) {
          lastJsonRef.current = [...data];
          applyAllData(data);
        }
      } catch {
        // silently ignore polling errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [applyAllData]);

  // Optimistic setters: update React state immediately, write to backend async
  const updateInventoryData = useCallback((data: InventoryData) => {
    setInventoryData(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[0] = json;
    getActor()
      .then((a) => a.setInventory(json))
      .catch(() => {});
  }, []);

  const updateBardanaData = useCallback((data: BardanaStoreData) => {
    setBardanaData(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[1] = json;
    getActor()
      .then((a) => a.setBardana(json))
      .catch(() => {});
  }, []);

  const updateRawMaterialsData = useCallback((data: InventoryData) => {
    setRawMaterialsData(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[4] = json;
    getActor()
      .then((a) => a.setRawMaterials(json))
      .catch(() => {});
  }, []);

  const updateOrdersData = useCallback((data: OrderRecord[]) => {
    setOrdersData(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[2] = json;
    getActor()
      .then((a) => a.setOrders(json))
      .catch(() => {});
  }, []);

  const updateToolsData = useCallback((data: ToolRecord[]) => {
    setToolsData(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[3] = json;
    getActor()
      .then((a) => a.setTools(json))
      .catch(() => {});
  }, []);

  const updateChangeLogInventory = useCallback((data: InventoryLogEntry[]) => {
    setChangeLogInventory(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[5] = json;
    getActor()
      .then((a) => a.setChangeLogInventory(json))
      .catch(() => {});
  }, []);

  const updateChangeLogBardana = useCallback((data: BardanaLogEntry[]) => {
    setChangeLogBardana(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[6] = json;
    getActor()
      .then((a) => a.setChangeLogBardana(json))
      .catch(() => {});
  }, []);

  const updateTransactionLog = useCallback((data: TransactionEntry[]) => {
    setTransactionLog(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[7] = json;
    getActor()
      .then((a) => a.setTransactionLog(json))
      .catch(() => {});
  }, []);

  const updateUsers = useCallback((data: User[]) => {
    setUsers(data);
    const json = JSON.stringify(data);
    lastJsonRef.current[8] = json;
    getActor()
      .then((a) => a.setUsers(json))
      .catch(() => {});
  }, []);

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
