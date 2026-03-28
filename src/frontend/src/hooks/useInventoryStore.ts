/**
 * localStorage-based inventory store hooks.
 * These are the primary persistence layer for Inventory, Bardana, Raw Materials,
 * Orders, and Tools & Machinery. Backend calls are fire-and-forget for change log only.
 */

import { useCallback, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLANTS = ["LS Pulses", "LS Foods LLP"] as const;
export type PlantName = (typeof PLANTS)[number];

export const INVENTORY_PRODUCTS = [
  "Indica",
  "Ghadi Green",
  "Ghadi Red",
  "Tiranga Kutta",
  "Tiranga Jarda",
  "L.S.",
  "Bahubali",
  "Kasturi",
  "Uttam",
  "Gajraj",
  "Khanda Rejection",
  "Kachari",
  "Kooda",
  "Akra",
  "Golden Tiger",
] as const;

export const BARDANA_PRODUCTS = [
  "Indica",
  "Ghadi Green",
  "Ghadi Red",
  "Tiranga",
  "L.S.",
  "Bahubali",
  "Kasturi",
  "Uttam",
  "Gajraj",
  "Plain 50kg bags",
  "Golden Tiger",
] as const;

export const RAW_MATERIAL_PRODUCTS = [
  "Vegetable Oil",
  "Diesel",
  "Firewood",
  "Glucose",
  "Colour",
  "Thread",
  "Emery",
  "Salt",
  "Cement",
] as const;

// ─── Branch Color Utility ────────────────────────────────────────────────────

export function branchTabClass(plant: string): string {
  if (plant === "LS Pulses") {
    return "data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:border-green-700 hover:text-green-700";
  }
  return "data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-600 hover:text-orange-600";
}

export function branchBadgeClass(plant: string): string {
  if (plant === "LS Pulses") {
    return "bg-green-100 text-green-800 border border-green-400 font-semibold";
  }
  return "bg-orange-100 text-orange-800 border border-orange-400 font-semibold";
}

// ─── Sorting Utility ─────────────────────────────────────────────────────────

export function sortProducts(
  products: Array<{ name: string; quantity: number }>,
  orderedList: readonly string[],
): Array<{ name: string; quantity: number }> {
  const withStock = products
    .filter((p) => p.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const withoutStock = orderedList
    .filter((name) => products.find((p) => p.name === name && p.quantity === 0))
    .map((name) => products.find((p) => p.name === name)!)
    .filter(Boolean);

  // Custom products not in the ordered list — append after built-ins
  const customWithoutStock = products.filter(
    (p) =>
      p.quantity === 0 && !(orderedList as readonly string[]).includes(p.name),
  );

  return [...withStock, ...withoutStock, ...customWithoutStock];
}

// ─── localStorage Helpers ────────────────────────────────────────────────────

function storageKey(
  prefix: string,
  plant: string,
  productName: string,
): string {
  return `${prefix}_${plant}_${productName}`;
}

function readValue(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return 0;
    const parsed = Number.parseFloat(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

function writeValue(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // silently ignore storage errors
  }
}

function initializeStoreIfNeeded(
  prefix: string,
  plants: readonly string[],
  products: readonly string[],
): void {
  for (const plant of plants) {
    for (const product of products) {
      const key = storageKey(prefix, plant, product);
      if (localStorage.getItem(key) === null) {
        writeValue(key, 0);
      }
    }
  }
}

// ─── Custom Products Helpers ─────────────────────────────────────────────────

function customProductsKey(prefix: string, plant: string): string {
  return `${prefix}_custom_products_${plant}`;
}

function readCustomProducts(prefix: string, plant: string): string[] {
  try {
    const raw = localStorage.getItem(customProductsKey(prefix, plant));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function writeCustomProducts(
  prefix: string,
  plant: string,
  products: string[],
): void {
  try {
    localStorage.setItem(
      customProductsKey(prefix, plant),
      JSON.stringify(products),
    );
  } catch {}
}

// ─── Deleted Built-in Products Helpers ───────────────────────────────────────

function deletedBuiltinsKey(prefix: string, plant: string): string {
  return `${prefix}_deleted_builtins_${plant}`;
}

function readDeletedBuiltins(prefix: string, plant: string): string[] {
  try {
    const raw = localStorage.getItem(deletedBuiltinsKey(prefix, plant));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function writeDeletedBuiltins(
  prefix: string,
  plant: string,
  names: string[],
): void {
  try {
    localStorage.setItem(
      deletedBuiltinsKey(prefix, plant),
      JSON.stringify(names),
    );
  } catch {}
}

// ─── Product Order Helpers ────────────────────────────────────────────────────

function productOrderKey(prefix: string, plant: string): string {
  return `${prefix}_product_order_${plant}`;
}

function readProductOrder(prefix: string, plant: string): string[] {
  try {
    const raw = localStorage.getItem(productOrderKey(prefix, plant));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function writeProductOrder(
  prefix: string,
  plant: string,
  order: string[],
): void {
  try {
    localStorage.setItem(productOrderKey(prefix, plant), JSON.stringify(order));
  } catch {}
}

// ─── Generic Store Hook Factory ───────────────────────────────────────────────

function createStoreHook(
  prefix: string,
  plants: readonly string[],
  products: readonly string[],
) {
  return function useStore() {
    const [, setVersion] = useState(0);
    const bump = useCallback(() => setVersion((v) => v + 1), []);

    try {
      initializeStoreIfNeeded(prefix, plants, products);
    } catch {
      // silently ignore
    }

    const getStock = (plant: string, productName: string): number => {
      return readValue(storageKey(prefix, plant, productName));
    };

    const setStock = (
      plant: string,
      productName: string,
      newQty: number,
    ): void => {
      const safeQty = Math.max(0, newQty);
      writeValue(storageKey(prefix, plant, productName), safeQty);
      setVersion((v) => v + 1);
    };

    const getAllProducts = (
      plant: string,
    ): Array<{ name: string; quantity: number }> => {
      const deletedBuiltins = readDeletedBuiltins(prefix, plant);
      const builtIn = products
        .filter((name) => !deletedBuiltins.includes(name))
        .map((name) => ({
          name,
          quantity: readValue(storageKey(prefix, plant, name)),
        }));
      const custom = readCustomProducts(prefix, plant).map((name) => ({
        name,
        quantity: readValue(storageKey(prefix, plant, name)),
      }));
      return [...builtIn, ...custom];
    };

    /**
     * Returns products in user-defined order (persisted in localStorage).
     * New products not yet in the order are appended at the end.
     */
    const getOrderedProducts = (
      plant: string,
    ): Array<{ name: string; quantity: number }> => {
      const all = getAllProducts(plant);
      const savedOrder = readProductOrder(prefix, plant);

      // Build a map for quick lookup
      const byName = new Map(all.map((p) => [p.name, p]));

      // Start with items in saved order that still exist
      const ordered: Array<{ name: string; quantity: number }> = [];
      for (const name of savedOrder) {
        if (byName.has(name)) {
          ordered.push(byName.get(name)!);
          byName.delete(name);
        }
      }
      // Append any remaining (new) products
      for (const p of all) {
        if (byName.has(p.name)) {
          ordered.push(p);
        }
      }

      return ordered;
    };

    const reorderProduct = (
      plant: string,
      name: string,
      direction: "up" | "down",
    ): void => {
      const ordered = getOrderedProducts(plant);
      const idx = ordered.findIndex((p) => p.name === name);
      if (idx === -1) return;

      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= ordered.length) return;

      const names = ordered.map((p) => p.name);
      [names[idx], names[newIdx]] = [names[newIdx], names[idx]];
      writeProductOrder(prefix, plant, names);
      bump();
    };

    const addProduct = (plant: string, name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      const existing = getAllProducts(plant);
      if (existing.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
        return false;
      const custom = readCustomProducts(prefix, plant);
      writeCustomProducts(prefix, plant, [...custom, trimmed]);
      writeValue(storageKey(prefix, plant, trimmed), 0);
      bump();
      return true;
    };

    const deleteProduct = (plant: string, name: string): void => {
      // Remove from custom order if present
      const currentOrder = readProductOrder(prefix, plant);
      if (currentOrder.includes(name)) {
        writeProductOrder(
          prefix,
          plant,
          currentOrder.filter((n) => n !== name),
        );
      }
      // If it's a built-in product, add to deleted list
      if ((products as readonly string[]).includes(name)) {
        const deleted = readDeletedBuiltins(prefix, plant);
        if (!deleted.includes(name)) {
          writeDeletedBuiltins(prefix, plant, [...deleted, name]);
        }
      } else {
        // It's a custom product — remove from custom list
        const custom = readCustomProducts(prefix, plant).filter(
          (p) => p !== name,
        );
        writeCustomProducts(prefix, plant, custom);
      }
      // Remove the stock value
      try {
        localStorage.removeItem(storageKey(prefix, plant, name));
      } catch {}
      bump();
    };

    return {
      getStock,
      setStock,
      getAllProducts,
      getOrderedProducts,
      reorderProduct,
      addProduct,
      deleteProduct,
    };
  };
}

// ─── Exported Hooks ───────────────────────────────────────────────────────────

export const useInventoryStore = createStoreHook(
  "ls_inventory",
  PLANTS,
  INVENTORY_PRODUCTS,
);
export const useBardanaStore = createStoreHook(
  "ls_bardana",
  PLANTS,
  BARDANA_PRODUCTS,
);
export const useRawMaterialsStore = createStoreHook(
  "ls_rawmat",
  PLANTS,
  RAW_MATERIAL_PRODUCTS,
);

// ─── Orders localStorage Store ───────────────────────────────────────────────

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

/** Computed summary for an order */
export function getOrderSummary(order: OrderRecord) {
  const ordered = Number.parseFloat(order.orderedBags) || 0;
  const delivered = order.deliveries.reduce(
    (sum, d) => sum + (Number.parseFloat(d.deliveredBags) || 0),
    0,
  );
  const remaining = ordered - delivered;
  const isCompleted = ordered > 0 && remaining <= 0;
  return { ordered, delivered, remaining, isCompleted };
}

/**
 * Returns the date of the last delivery for a completed order.
 * Used to determine if the order is older than 3 months.
 */
export function getCompletionDate(order: OrderRecord): number {
  if (order.deliveries.length === 0) return order.createdAt;
  const lastDelivery = order.deliveries.reduce((latest, d) => {
    const t = new Date(d.date).getTime();
    return t > latest ? t : latest;
  }, 0);
  return lastDelivery || order.createdAt;
}

/** Filter completed orders to past 3 months (based on last delivery date) */
export function filterCompletedOrders(orders: OrderRecord[]): OrderRecord[] {
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return orders.filter((o) => {
    const { isCompleted } = getOrderSummary(o);
    return isCompleted && getCompletionDate(o) >= threeMonthsAgo;
  });
}

const ORDERS_KEY = "ls_orders_v2";

function readOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OrderRecord[];
  } catch {
    return [];
  }
}

function writeOrders(orders: OrderRecord[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

/**
 * Purge completed orders whose last delivery date is older than 3 months.
 * Called on store initialization so stale data is cleaned up automatically.
 */
function purgeOldCompletedOrders(): void {
  const orders = readOrders();
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const kept = orders.filter((o) => {
    const { isCompleted } = getOrderSummary(o);
    if (!isCompleted) return true; // keep all active orders
    return getCompletionDate(o) >= threeMonthsAgo;
  });
  if (kept.length !== orders.length) {
    writeOrders(kept);
  }
}

export function useOrdersStore() {
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // Purge old completed orders on each render cycle (lightweight — only writes when needed)
  try {
    purgeOldCompletedOrders();
  } catch {
    // ignore
  }

  const getOrders = (): OrderRecord[] => readOrders();

  const addOrder = (
    order: Omit<OrderRecord, "id" | "createdAt" | "deliveries">,
  ): OrderRecord => {
    const orders = readOrders();
    const newOrder: OrderRecord = {
      ...order,
      deliveries: [],
      id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    writeOrders([...orders, newOrder]);
    bump();
    return newOrder;
  };

  const updateOrder = (
    id: string,
    updates: Partial<Omit<OrderRecord, "id" | "createdAt" | "deliveries">>,
  ): void => {
    const orders = readOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return;
    orders[idx] = { ...orders[idx], ...updates };
    writeOrders(orders);
    bump();
  };

  const deleteOrder = (id: string): void => {
    const orders = readOrders().filter((o) => o.id !== id);
    writeOrders(orders);
    bump();
  };

  const addDelivery = (
    orderId: string,
    delivery: Omit<DeliveryRecord, "id" | "createdAt">,
  ): void => {
    const orders = readOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const newDelivery: DeliveryRecord = {
      ...delivery,
      id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    orders[idx] = {
      ...orders[idx],
      deliveries: [...orders[idx].deliveries, newDelivery],
    };
    writeOrders(orders);
    bump();
  };

  const updateDelivery = (
    orderId: string,
    deliveryId: string,
    updates: Partial<Omit<DeliveryRecord, "id" | "createdAt">>,
  ): void => {
    const orders = readOrders();
    const oIdx = orders.findIndex((o) => o.id === orderId);
    if (oIdx === -1) return;
    const dIdx = orders[oIdx].deliveries.findIndex((d) => d.id === deliveryId);
    if (dIdx === -1) return;
    orders[oIdx].deliveries[dIdx] = {
      ...orders[oIdx].deliveries[dIdx],
      ...updates,
    };
    writeOrders(orders);
    bump();
  };

  const deleteDelivery = (orderId: string, deliveryId: string): void => {
    const orders = readOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    orders[idx] = {
      ...orders[idx],
      deliveries: orders[idx].deliveries.filter((d) => d.id !== deliveryId),
    };
    writeOrders(orders);
    bump();
  };

  return {
    getOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    addDelivery,
    updateDelivery,
    deleteDelivery,
  };
}

// ─── Tools & Machinery localStorage Store ────────────────────────────────────

export interface ToolRecord {
  id: string;
  plant: string;
  product: string;
  quantity: string;
  remarks: string;
  createdAt: number;
}

const TOOLS_KEY = "ls_tools_v1";

function readTools(): ToolRecord[] {
  try {
    const raw = localStorage.getItem(TOOLS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ToolRecord[];
  } catch {
    return [];
  }
}

function writeTools(tools: ToolRecord[]): void {
  try {
    localStorage.setItem(TOOLS_KEY, JSON.stringify(tools));
  } catch {
    // ignore
  }
}

export function useToolsStore() {
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const getTools = (plant: string): ToolRecord[] =>
    readTools().filter((t) => t.plant === plant);

  const addTool = (tool: Omit<ToolRecord, "id" | "createdAt">): ToolRecord => {
    const tools = readTools();
    const newTool: ToolRecord = {
      ...tool,
      id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    writeTools([...tools, newTool]);
    bump();
    return newTool;
  };

  const updateTool = (
    id: string,
    updates: Partial<Omit<ToolRecord, "id" | "createdAt">>,
  ): void => {
    const tools = readTools();
    const idx = tools.findIndex((t) => t.id === id);
    if (idx === -1) return;
    tools[idx] = { ...tools[idx], ...updates };
    writeTools(tools);
    bump();
  };

  const deleteTool = (id: string): void => {
    const tools = readTools().filter((t) => t.id !== id);
    writeTools(tools);
    bump();
  };

  /**
   * Move a tool up or down within its plant's list.
   */
  const reorderTool = (
    plant: string,
    id: string,
    direction: "up" | "down",
  ): void => {
    const all = readTools();
    // Get indices of tools belonging to this plant
    const plantIndices = all
      .map((t, i) => (t.plant === plant ? i : -1))
      .filter((i) => i !== -1);
    const posInPlant = plantIndices.findIndex((gi) => all[gi].id === id);
    if (posInPlant === -1) return;

    const newPosInPlant = direction === "up" ? posInPlant - 1 : posInPlant + 1;
    if (newPosInPlant < 0 || newPosInPlant >= plantIndices.length) return;

    const idxA = plantIndices[posInPlant];
    const idxB = plantIndices[newPosInPlant];
    [all[idxA], all[idxB]] = [all[idxB], all[idxA]];
    writeTools(all);
    bump();
  };

  return { getTools, addTool, updateTool, deleteTool, reorderTool };
}

// ─── Bardana Calculation Helpers ─────────────────────────────────────────────

/**
 * Stores the user-entered "Added Bardana" value per plant/product.
 * Each entry in the Added Bardana column accumulates (adds to existing total).
 */
function bardanaAddedKey(plant: string, product: string): string {
  return `bardana_added_${plant}_${product}`;
}

export function getBardanaAdded(plant: string, product: string): number {
  return readValue(bardanaAddedKey(plant, product));
}

export function addToBardanaAdded(
  plant: string,
  product: string,
  amount: number,
): void {
  const current = getBardanaAdded(plant, product);
  writeValue(bardanaAddedKey(plant, product), current + amount);
}

/**
 * Accumulated inventory additions for bardana Current Stock calculation.
 * Incremented whenever inventory is added for a plant/product.
 */
function bardanaAccumInvKey(plant: string, product: string): string {
  return `bardana_accum_inv_${plant}_${product}`;
}

export function getBardanaAccumulatedInventory(
  plant: string,
  product: string,
): number {
  return readValue(bardanaAccumInvKey(plant, product));
}

export function addToBardanaAccumulatedInventory(
  plant: string,
  product: string,
  amount: number,
): void {
  const current = getBardanaAccumulatedInventory(plant, product);
  writeValue(bardanaAccumInvKey(plant, product), current + amount);
}

/**
 * Maps an inventory product name to the corresponding bardana product name.
 * Returns null if no bardana mapping exists.
 */
export function inventoryToBardanaProduct(invProduct: string): string | null {
  // Direct matches
  const directMatches = [
    "Indica",
    "Ghadi Green",
    "Ghadi Red",
    "L.S.",
    "Bahubali",
    "Kasturi",
    "Uttam",
    "Gajraj",
    "Golden Tiger",
  ];
  if (directMatches.includes(invProduct)) return invProduct;
  // No bardana equivalent for Tiranga Kutta, Tiranga Jarda, Khanda Rejection, etc.
  return null;
}

/**
 * Hook providing reactive access to bardana calculation values.
 */
export function useBardanaCalculations() {
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const getAddedBardana = (plant: string, product: string): number =>
    getBardanaAdded(plant, product);

  const recordAddedBardana = (
    plant: string,
    product: string,
    amount: number,
  ): void => {
    if (amount <= 0) return;
    addToBardanaAdded(plant, product, amount);
    bump();
  };

  const getAccumulatedInventory = (plant: string, product: string): number =>
    getBardanaAccumulatedInventory(plant, product);

  const computeCurrentStock = (
    plant: string,
    product: string,
    actualStock: number,
  ): number => {
    const addedBardana = getBardanaAdded(plant, product);
    const addedInventory = getBardanaAccumulatedInventory(plant, product);
    return actualStock + addedBardana - addedInventory;
  };

  const getStockInWH = (plant: string, product: string): number =>
    getBardanaStockInWH(plant, product);

  const setStockInWH = (
    plant: string,
    product: string,
    value: number,
  ): void => {
    setBardanaStockInWHValue(plant, product, value);
    bump();
  };

  return {
    getAddedBardana,
    recordAddedBardana,
    getAccumulatedInventory,
    computeCurrentStock,
    getStockInWH,
    setStockInWH,
  };
}

// ─── Bardana Stock in WH Helpers ─────────────────────────────────────────────

/**
 * Stores the "Stock in WH" (warehouse stock) value per plant/product in Bardana.
 * This is an editable informational field displayed after the Product column.
 */
function bardanaStockInWHKey(plant: string, product: string): string {
  return `bardana_wh_stock_${plant}_${product}`;
}

export function getBardanaStockInWH(plant: string, product: string): number {
  return readValue(bardanaStockInWHKey(plant, product));
}

export function setBardanaStockInWHValue(
  plant: string,
  product: string,
  value: number,
): void {
  writeValue(bardanaStockInWHKey(plant, product), Math.max(0, value));
}
