/**
 * Dedicated daily transaction log for Inventory tab.
 * Records each add/subtract operation with plant, product, type, quantity, and timestamp.
 * Used to generate "Today's filling" and "Today's selling" sections in the WhatsApp report.
 */

import { useCallback, useState } from "react";

const TRANSACTION_LOG_KEY = "ls_inventory_txn_log";

export interface TransactionEntry {
  id: string;
  plant: string;
  product: string;
  type: "add" | "subtract";
  quantity: number;
  timestamp: number;
}

function readLog(): TransactionEntry[] {
  try {
    const raw = localStorage.getItem(TRANSACTION_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TransactionEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: TransactionEntry[]): void {
  try {
    localStorage.setItem(TRANSACTION_LOG_KEY, JSON.stringify(entries));
  } catch {}
}

function pruneOldEntries(entries: TransactionEntry[]): TransactionEntry[] {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return entries.filter((e) => e.timestamp >= sevenDaysAgo);
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

export function getTodaySummary(
  plant: string,
  type: "add" | "subtract",
): Array<{ name: string; quantity: number }> {
  const entries = readLog().filter(
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
}

export function useTransactionLog() {
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const logTransaction = (
    plant: string,
    product: string,
    type: "add" | "subtract",
    quantity: number,
  ): void => {
    if (quantity <= 0) return;
    const entries = pruneOldEntries(readLog());
    const newEntry: TransactionEntry = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      plant,
      product,
      type,
      quantity,
      timestamp: Date.now(),
    };
    writeLog([...entries, newEntry]);
    bump();
  };

  return { logTransaction };
}
