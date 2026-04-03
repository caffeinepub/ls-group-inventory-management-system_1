/**
 * Context-based change log for Inventory, Bardana, and Orders tabs.
 * Captures the last 5 days of changes, shared across all users/devices.
 */

import {
  type BardanaLogEntry,
  type InventoryLogEntry,
  type OrderLogEntry,
  useDataStore,
} from "@/contexts/DataStoreContext";

// Re-export types for compatibility
export type { BardanaLogEntry, InventoryLogEntry, OrderLogEntry };

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function prune<T extends { timestamp: number }>(entries: T[]): T[] {
  const cutoff = Date.now() - FIVE_DAYS_MS;
  return entries.filter((e) => e.timestamp >= cutoff);
}

export function useChangeLog() {
  const {
    changeLogInventory,
    changeLogBardana,
    changeLogOrders,
    updateChangeLogInventory,
    updateChangeLogBardana,
    updateChangeLogOrders,
  } = useDataStore();

  const logInventoryChange = (
    plant: string,
    product: string,
    qtyChange: number,
    userId: string,
  ): void => {
    if (qtyChange === 0) return;
    const pruned = prune(changeLogInventory);
    const entry: InventoryLogEntry = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      plant,
      product,
      qtyChange,
      userId,
    };
    updateChangeLogInventory([entry, ...pruned]);
  };

  const logBardanaChange = (
    plant: string,
    product: string,
    column: string,
    previousQty: number,
    newQty: number,
    userId: string,
  ): void => {
    if (previousQty === newQty) return;
    const pruned = prune(changeLogBardana);
    const entry: BardanaLogEntry = {
      id: `bar_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      plant,
      product,
      column,
      previousQty,
      newQty,
      userId,
    };
    updateChangeLogBardana([entry, ...pruned]);
  };

  const logOrderChange = (
    order: {
      date: string;
      orderedBags: string;
      brand: string;
      partyName: string;
      rate: string;
      dalalName: string;
      seqId?: number;
    },
    qtyChange: number,
    userId: string,
  ): void => {
    if (qtyChange === 0) return;
    const pruned = prune(changeLogOrders);
    const entry: OrderLogEntry = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orderId: order.seqId,
      timestamp: Date.now(),
      orderDate: order.date,
      orderedBags: order.orderedBags,
      brand: order.brand,
      partyName: order.partyName,
      rate: order.rate,
      broker: order.dalalName,
      qtyChange,
      userId,
    };
    updateChangeLogOrders([entry, ...pruned]);
  };

  const getInventoryLog = (): InventoryLogEntry[] =>
    prune(changeLogInventory).sort((a, b) => b.timestamp - a.timestamp);

  const getBardanaLog = (): BardanaLogEntry[] =>
    prune(changeLogBardana)
      .map((e) => ({ ...e, column: e.column ?? "Initial Stock" }))
      .sort((a, b) => b.timestamp - a.timestamp);

  const getOrderLog = (): OrderLogEntry[] =>
    prune(changeLogOrders).sort((a, b) => b.timestamp - a.timestamp);

  return {
    logInventoryChange,
    logBardanaChange,
    logOrderChange,
    getInventoryLog,
    getBardanaLog,
    getOrderLog,
  };
}
