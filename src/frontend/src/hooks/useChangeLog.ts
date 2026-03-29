/**
 * Context-based change log for Inventory and Bardana tabs.
 * Captures the last 5 days of changes, shared across all users/devices.
 */

import {
  type BardanaLogEntry,
  type InventoryLogEntry,
  useDataStore,
} from "@/contexts/DataStoreContext";

// Re-export types for compatibility
export type { BardanaLogEntry, InventoryLogEntry };

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function prune<T extends { timestamp: number }>(entries: T[]): T[] {
  const cutoff = Date.now() - FIVE_DAYS_MS;
  return entries.filter((e) => e.timestamp >= cutoff);
}

export function useChangeLog() {
  const {
    changeLogInventory,
    changeLogBardana,
    updateChangeLogInventory,
    updateChangeLogBardana,
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

  const getInventoryLog = (): InventoryLogEntry[] =>
    prune(changeLogInventory).sort((a, b) => b.timestamp - a.timestamp);

  const getBardanaLog = (): BardanaLogEntry[] =>
    prune(changeLogBardana)
      .map((e) => ({ ...e, column: e.column ?? "Initial Stock" }))
      .sort((a, b) => b.timestamp - a.timestamp);

  return {
    logInventoryChange,
    logBardanaChange,
    getInventoryLog,
    getBardanaLog,
  };
}
