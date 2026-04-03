/**
 * Context-based daily transaction log for Inventory tab.
 * Records each add/subtract operation with plant, product, type, quantity, and timestamp.
 * Used to generate "Today's filling" and "Today's selling" sections in the WhatsApp report.
 */

import {
  type TransactionEntry,
  useDataStore,
} from "@/contexts/DataStoreContext";

export type { TransactionEntry };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function pruneOldEntries(entries: TransactionEntry[]): TransactionEntry[] {
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  return entries.filter((e) => e.timestamp >= cutoff);
}

function todayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return dateStr === todayDateString();
}

export function useTransactionLog() {
  const { transactionLog, updateTransactionLog } = useDataStore();

  const logTransaction = (
    plant: string,
    product: string,
    type: "add" | "subtract",
    quantity: number,
  ): void => {
    if (quantity <= 0) return;
    const pruned = pruneOldEntries(transactionLog);
    const newEntry: TransactionEntry = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      plant,
      product,
      type,
      quantity,
      timestamp: Date.now(),
    };
    updateTransactionLog([...pruned, newEntry]);
  };

  /**
   * Batch log both add and subtract in a single state update.
   * Use this when both occur in the same transaction to avoid the second
   * call reading stale state and overwriting the first (React async state).
   */
  const logTransactionBatch = (
    entries: Array<{
      plant: string;
      product: string;
      type: "add" | "subtract";
      quantity: number;
    }>,
  ): void => {
    const valid = entries.filter((e) => e.quantity > 0);
    if (valid.length === 0) return;
    const pruned = pruneOldEntries(transactionLog);
    const now = Date.now();
    const newEntries: TransactionEntry[] = valid.map((e, i) => ({
      id: `txn_${now + i}_${Math.random().toString(36).slice(2, 8)}`,
      plant: e.plant,
      product: e.product,
      type: e.type,
      quantity: e.quantity,
      timestamp: now + i,
    }));
    updateTransactionLog([...pruned, ...newEntries]);
  };

  const getTodaySummary = (
    plant: string,
    type: "add" | "subtract",
  ): Array<{ name: string; quantity: number }> => {
    const entries = transactionLog.filter(
      (e) => e.plant === plant && e.type === type && isToday(e.timestamp),
    );
    const totals = new Map<string, number>();
    for (const entry of entries) {
      totals.set(
        entry.product,
        (totals.get(entry.product) ?? 0) + entry.quantity,
      );
    }
    return Array.from(totals.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .filter((p) => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);
  };

  return { logTransaction, logTransactionBatch, getTodaySummary };
}

/**
 * @deprecated Use useTransactionLog().getTodaySummary() hook instead.
 * Kept for backward compatibility only — returns empty array.
 */
export function getTodaySummary(
  _plant: string,
  _type: "add" | "subtract",
): Array<{ name: string; quantity: number }> {
  return [];
}
