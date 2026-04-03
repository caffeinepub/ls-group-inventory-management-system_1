/**
 * Context-based inventory store hooks.
 * All data is backed by the shared backend canister via DataStoreContext.
 * Supports cross-device, cross-user data sharing.
 */

import {
  type BardanaEntry,
  type BardanaPlantMeta,
  type BardanaStoreData,
  type DeliveryRecord,
  type InventoryData,
  type OrderRecord,
  type PlantData,
  type ToolRecord,
  useDataStore,
} from "@/contexts/DataStoreContext";

// ─── Constants ──────────────────────────────────────────────────────────────────

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

// ─── Branch Color Utility ───────────────────────────────────────────────────────

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

// ─── Sorting Utility ────────────────────────────────────────────────────────────────

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

  const customWithoutStock = products.filter(
    (p) =>
      p.quantity === 0 && !(orderedList as readonly string[]).includes(p.name),
  );

  return [...withStock, ...withoutStock, ...customWithoutStock];
}

// ─── Generic Plant Data Helper ───────────────────────────────────────────────────────────

function getEmptyPlantData(): PlantData {
  return {
    quantities: {},
    customProducts: [],
    deletedBuiltins: [],
    productOrder: [],
  };
}

function mergePlantData(existing: PlantData | undefined): PlantData {
  return { ...getEmptyPlantData(), ...existing };
}

function buildProductList(
  data: InventoryData,
  plant: string,
  builtins: readonly string[],
): Array<{ name: string; quantity: number }> {
  const pd = mergePlantData(data[plant]);
  const deleted = new Set(pd.deletedBuiltins);
  const builtinArr = Array.from(builtins);
  const builtIn = builtinArr
    .filter((n) => !deleted.has(n))
    .map((n) => ({ name: n, quantity: pd.quantities[n] ?? 0 }));
  const custom = pd.customProducts.map((n) => ({
    name: n,
    quantity: pd.quantities[n] ?? 0,
  }));
  return [...builtIn, ...custom];
}

function buildOrderedProductList(
  data: InventoryData,
  plant: string,
  builtins: readonly string[],
): Array<{ name: string; quantity: number }> {
  const all = buildProductList(data, plant, builtins);
  const savedOrder = mergePlantData(data[plant]).productOrder;
  const byName = new Map(all.map((p) => [p.name, p]));
  const ordered: Array<{ name: string; quantity: number }> = [];
  for (const name of savedOrder) {
    if (byName.has(name)) {
      ordered.push(byName.get(name)!);
      byName.delete(name);
    }
  }
  for (const [, p] of byName) ordered.push(p);
  return ordered;
}

// ─── Generic Plant Data Store Hook Factory ───────────────────────────────────────────

function usePlantDataStore(
  data: InventoryData,
  updateData: (d: InventoryData) => void,
  builtins: readonly string[],
) {
  const pd = (plant: string) => mergePlantData(data[plant]);

  const getStock = (plant: string, product: string): number =>
    pd(plant).quantities[product] ?? 0;

  const setStock = (plant: string, product: string, qty: number): void => {
    const plantData = pd(plant);
    updateData({
      ...data,
      [plant]: {
        ...plantData,
        quantities: { ...plantData.quantities, [product]: Math.max(0, qty) },
      },
    });
  };

  const getAllProducts = (
    plant: string,
  ): Array<{ name: string; quantity: number }> =>
    buildProductList(data, plant, builtins);

  const getOrderedProducts = (
    plant: string,
  ): Array<{ name: string; quantity: number }> =>
    buildOrderedProductList(data, plant, builtins);

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
    const plantData = pd(plant);
    updateData({ ...data, [plant]: { ...plantData, productOrder: names } });
  };

  const addProduct = (plant: string, name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const all = getAllProducts(plant);
    if (all.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
      return false;
    const plantData = pd(plant);
    updateData({
      ...data,
      [plant]: {
        ...plantData,
        customProducts: [...plantData.customProducts, trimmed],
        quantities: { ...plantData.quantities, [trimmed]: 0 },
      },
    });
    return true;
  };

  const deleteProduct = (plant: string, name: string): void => {
    const plantData = pd(plant);
    const isBuiltin = Array.from(builtins).includes(name);
    const newQty = { ...plantData.quantities };
    delete newQty[name];
    updateData({
      ...data,
      [plant]: {
        ...plantData,
        quantities: newQty,
        productOrder: plantData.productOrder.filter((n) => n !== name),
        deletedBuiltins: isBuiltin
          ? [...plantData.deletedBuiltins, name]
          : plantData.deletedBuiltins,
        customProducts: isBuiltin
          ? plantData.customProducts
          : plantData.customProducts.filter((n) => n !== name),
      },
    });
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
}

// ─── Exported Hooks ─────────────────────────────────────────────────────────────────

export function useInventoryStore() {
  const { inventoryData, updateInventoryData } = useDataStore();
  return usePlantDataStore(
    inventoryData,
    updateInventoryData,
    INVENTORY_PRODUCTS,
  );
}

export function useBardanaStore() {
  const { bardanaData, updateBardanaData } = useDataStore();

  const bKey = (plant: string, product: string) => `${plant}__${product}`;

  const getEntry = (plant: string, product: string): BardanaEntry =>
    bardanaData.entries[bKey(plant, product)] ?? {
      initialStock: 0,
      stockInWH: 0,
      addedBardana: 0,
      accumulatedInventory: 0,
    };

  const getMeta = (plant: string): BardanaPlantMeta =>
    bardanaData.plantMeta[plant] ?? {
      customProducts: [],
      deletedBuiltins: [],
      productOrder: [],
    };

  const getStock = (plant: string, product: string): number =>
    getEntry(plant, product).initialStock;

  const setStock = (plant: string, product: string, qty: number): void => {
    const key = bKey(plant, product);
    const entry = getEntry(plant, product);
    updateBardanaData({
      ...bardanaData,
      entries: {
        ...bardanaData.entries,
        [key]: { ...entry, initialStock: Math.max(0, qty) },
      },
    });
  };

  const getAllProducts = (
    plant: string,
  ): Array<{ name: string; quantity: number }> => {
    const meta = getMeta(plant);
    const deleted = new Set(meta.deletedBuiltins);
    const builtIn = Array.from(BARDANA_PRODUCTS)
      .filter((n) => !deleted.has(n))
      .map((n) => ({ name: n, quantity: getEntry(plant, n).initialStock }));
    const custom = meta.customProducts.map((n) => ({
      name: n,
      quantity: getEntry(plant, n).initialStock,
    }));
    return [...builtIn, ...custom];
  };

  const getOrderedProducts = (
    plant: string,
  ): Array<{ name: string; quantity: number }> => {
    const all = getAllProducts(plant);
    const savedOrder = getMeta(plant).productOrder;
    const byName = new Map(all.map((p) => [p.name, p]));
    const ordered: Array<{ name: string; quantity: number }> = [];
    for (const name of savedOrder) {
      if (byName.has(name)) {
        ordered.push(byName.get(name)!);
        byName.delete(name);
      }
    }
    for (const [, p] of byName) ordered.push(p);
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
    const meta = getMeta(plant);
    updateBardanaData({
      ...bardanaData,
      plantMeta: {
        ...bardanaData.plantMeta,
        [plant]: { ...meta, productOrder: names },
      },
    });
  };

  const addProduct = (plant: string, name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const all = getAllProducts(plant);
    if (all.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
      return false;
    const meta = getMeta(plant);
    updateBardanaData({
      ...bardanaData,
      plantMeta: {
        ...bardanaData.plantMeta,
        [plant]: { ...meta, customProducts: [...meta.customProducts, trimmed] },
      },
    });
    return true;
  };

  const deleteProduct = (plant: string, name: string): void => {
    const meta = getMeta(plant);
    const isBuiltin = Array.from(BARDANA_PRODUCTS).includes(
      name as (typeof BARDANA_PRODUCTS)[number],
    );
    const newEntries = { ...bardanaData.entries };
    delete newEntries[bKey(plant, name)];
    updateBardanaData({
      ...bardanaData,
      entries: newEntries,
      plantMeta: {
        ...bardanaData.plantMeta,
        [plant]: {
          ...meta,
          productOrder: meta.productOrder.filter((n) => n !== name),
          deletedBuiltins: isBuiltin
            ? [...meta.deletedBuiltins, name]
            : meta.deletedBuiltins,
          customProducts: isBuiltin
            ? meta.customProducts
            : meta.customProducts.filter((n) => n !== name),
        },
      },
    });
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
}

export function useRawMaterialsStore() {
  const { rawMaterialsData, updateRawMaterialsData } = useDataStore();
  return usePlantDataStore(
    rawMaterialsData,
    updateRawMaterialsData,
    RAW_MATERIAL_PRODUCTS,
  );
}

// ─── Orders Store ─────────────────────────────────────────────────────────────────

// Re-export types for compatibility
export type { DeliveryRecord, OrderRecord } from "@/contexts/DataStoreContext";

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

export function getCompletionDate(order: OrderRecord): number {
  if (order.deliveries.length === 0) return order.createdAt;
  const lastDelivery = order.deliveries.reduce((latest, d) => {
    const t = new Date(d.date).getTime();
    return t > latest ? t : latest;
  }, 0);
  return lastDelivery || order.createdAt;
}

export function filterCompletedOrders(orders: OrderRecord[]): OrderRecord[] {
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return orders.filter((o) => {
    const { isCompleted } = getOrderSummary(o);
    return isCompleted && getCompletionDate(o) >= threeMonthsAgo;
  });
}

export function useOrdersStore() {
  const { ordersData, updateOrdersData } = useDataStore();

  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const getOrders = (): OrderRecord[] =>
    ordersData.filter((o) => {
      const { isCompleted } = getOrderSummary(o);
      if (!isCompleted) return true;
      return getCompletionDate(o) >= threeMonthsAgo;
    });

  const addOrder = (
    order: Omit<OrderRecord, "id" | "createdAt" | "deliveries">,
  ): OrderRecord => {
    const newOrder: OrderRecord = {
      ...order,
      deliveries: [],
      id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    updateOrdersData([...ordersData, newOrder]);
    return newOrder;
  };

  const updateOrder = (
    id: string,
    updates: Partial<Omit<OrderRecord, "id" | "createdAt" | "deliveries">>,
  ): void => {
    const updated = ordersData.map((o) =>
      o.id === id ? { ...o, ...updates } : o,
    );
    updateOrdersData(updated);
  };

  const deleteOrder = (id: string): void => {
    updateOrdersData(ordersData.filter((o) => o.id !== id));
  };

  const addDelivery = (
    orderId: string,
    delivery: Omit<DeliveryRecord, "id" | "createdAt">,
  ): void => {
    const newDelivery: DeliveryRecord = {
      ...delivery,
      id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    const updated = ordersData.map((o) =>
      o.id === orderId
        ? { ...o, deliveries: [...o.deliveries, newDelivery] }
        : o,
    );
    updateOrdersData(updated);
  };

  const updateDelivery = (
    orderId: string,
    deliveryId: string,
    updates: Partial<Omit<DeliveryRecord, "id" | "createdAt">>,
  ): void => {
    const updated = ordersData.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        deliveries: o.deliveries.map((d) =>
          d.id === deliveryId ? { ...d, ...updates } : d,
        ),
      };
    });
    updateOrdersData(updated);
  };

  const deleteDelivery = (orderId: string, deliveryId: string): void => {
    const updated = ordersData.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        deliveries: o.deliveries.filter((d) => d.id !== deliveryId),
      };
    });
    updateOrdersData(updated);
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

// ─── Tools & Machinery Store ───────────────────────────────────────────────────────────

export type { ToolRecord } from "@/contexts/DataStoreContext";

export function useToolsStore() {
  const { toolsData, updateToolsData } = useDataStore();

  const getTools = (plant: string): ToolRecord[] =>
    toolsData.filter((t) => t.plant === plant);

  const addTool = (tool: Omit<ToolRecord, "id" | "createdAt">): ToolRecord => {
    const newTool: ToolRecord = {
      ...tool,
      id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    updateToolsData([...toolsData, newTool]);
    return newTool;
  };

  const updateTool = (
    id: string,
    updates: Partial<Omit<ToolRecord, "id" | "createdAt">>,
  ): void => {
    updateToolsData(
      toolsData.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTool = (id: string): void => {
    updateToolsData(toolsData.filter((t) => t.id !== id));
  };

  const reorderTool = (
    plant: string,
    id: string,
    direction: "up" | "down",
  ): void => {
    const all = [...toolsData];
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
    updateToolsData(all);
  };

  return { getTools, addTool, updateTool, deleteTool, reorderTool };
}

// ─── Bardana Calculations Hook ───────────────────────────────────────────────────────────

/**
 * Maps an inventory product name to its corresponding bardana product name.
 * Tiranga Kutta and Tiranga Jarda both map to "Tiranga" in bardana.
 */
export function inventoryToBardanaProduct(invProduct: string): string | null {
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
  if (invProduct === "Tiranga Kutta" || invProduct === "Tiranga Jarda")
    return "Tiranga";
  return null;
}

export function useBardanaCalculations() {
  const { bardanaData, updateBardanaData } = useDataStore();

  const bKey = (plant: string, product: string) => `${plant}__${product}`;

  const getEntry = (plant: string, product: string): BardanaEntry =>
    bardanaData.entries[bKey(plant, product)] ?? {
      initialStock: 0,
      stockInWH: 0,
      addedBardana: 0,
      accumulatedInventory: 0,
    };

  const updateEntry = (
    plant: string,
    product: string,
    patch: Partial<BardanaEntry>,
  ) => {
    const key = bKey(plant, product);
    const current = getEntry(plant, product);
    updateBardanaData({
      ...bardanaData,
      entries: { ...bardanaData.entries, [key]: { ...current, ...patch } },
    });
  };

  const getAddedBardana = (plant: string, product: string): number =>
    getEntry(plant, product).addedBardana;

  const recordAddedBardana = (
    plant: string,
    product: string,
    amount: number,
  ): void => {
    if (amount <= 0) return;
    const current = getEntry(plant, product);
    updateEntry(plant, product, {
      addedBardana: current.addedBardana + amount,
    });
  };

  const getAccumulatedInventory = (plant: string, product: string): number =>
    getEntry(plant, product).accumulatedInventory;

  const addToAccumulatedInventory = (
    plant: string,
    product: string,
    amount: number,
  ): void => {
    if (amount <= 0) return;
    const current = getEntry(plant, product);
    updateEntry(plant, product, {
      accumulatedInventory: current.accumulatedInventory + amount,
    });
  };

  const computeCurrentStock = (
    plant: string,
    product: string,
    actualStock: number,
  ): number => {
    const entry = getEntry(plant, product);
    return actualStock + entry.addedBardana - entry.accumulatedInventory;
  };

  const getStockInWH = (plant: string, product: string): number =>
    getEntry(plant, product).stockInWH;

  const setStockInWH = (
    plant: string,
    product: string,
    value: number,
  ): void => {
    updateEntry(plant, product, { stockInWH: Math.max(0, value) });
  };

  return {
    getAddedBardana,
    recordAddedBardana,
    getAccumulatedInventory,
    addToAccumulatedInventory,
    computeCurrentStock,
    getStockInWH,
    setStockInWH,
  };
}

// ─── Deprecated standalone functions (kept for compatibility) ─────────────────
// These are no-ops; use useBardanaCalculations() hook instead.

/** @deprecated Use useBardanaCalculations().addToAccumulatedInventory() instead */
export function addToBardanaAccumulatedInventory(
  _plant: string,
  _product: string,
  _amount: number,
): void {
  // No-op: functionality moved to useBardanaCalculations hook
}

/** @deprecated Use useBardanaCalculations().getAccumulatedInventory() instead */
export function getBardanaAccumulatedInventory(
  _plant: string,
  _product: string,
): number {
  return 0;
}

/** @deprecated Use useBardanaCalculations().getAddedBardana() instead */
export function getBardanaAdded(_plant: string, _product: string): number {
  return 0;
}

/** @deprecated Use useBardanaCalculations().getStockInWH() instead */
export function getBardanaStockInWH(_plant: string, _product: string): number {
  return 0;
}
