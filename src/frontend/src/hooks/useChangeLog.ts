/**
 * localStorage-based change log for Inventory and Bardana tabs.
 * Captures the last 5 days of changes.
 */

import { useCallback, useState } from "react";

const INVENTORY_LOG_KEY = "ls_changelog_inventory";
const BARDANA_LOG_KEY = "ls_changelog_bardana";
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryLogEntry {
  id: string;
  timestamp: number;
  plant: string;
  product: string;
  qtyChange: number; // positive = added, negative = subtracted
  userId: string;
}

export interface BardanaLogEntry {
  id: string;
  timestamp: number;
  plant: string;
  product: string;
  column: string; // "Initial Stock" | "Added Bardana" | "Current Stock"
  previousQty: number;
  newQty: number;
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prune<T extends { timestamp: number }>(entries: T[]): T[] {
  const cutoff = Date.now() - FIVE_DAYS_MS;
  return entries.filter((e) => e.timestamp >= cutoff);
}

function readInventoryLog(): InventoryLogEntry[] {
  try {
    const raw = localStorage.getItem(INVENTORY_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InventoryLogEntry[];
  } catch {
    return [];
  }
}

function writeInventoryLog(entries: InventoryLogEntry[]): void {
  try {
    localStorage.setItem(INVENTORY_LOG_KEY, JSON.stringify(entries));
  } catch {}
}

function readBardanaLog(): BardanaLogEntry[] {
  try {
    const raw = localStorage.getItem(BARDANA_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BardanaLogEntry[];
    // Backward compatibility: add default column if missing
    return parsed.map((e) => ({ ...e, column: e.column ?? "Initial Stock" }));
  } catch {
    return [];
  }
}

function writeBardanaLog(entries: BardanaLogEntry[]): void {
  try {
    localStorage.setItem(BARDANA_LOG_KEY, JSON.stringify(entries));
  } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChangeLog() {
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  /**
   * Log an inventory stock change.
   */
  const logInventoryChange = (
    plant: string,
    product: string,
    qtyChange: number,
    userId: string,
  ): void => {
    if (qtyChange === 0) return;
    const entries = prune(readInventoryLog());
    const entry: InventoryLogEntry = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      plant,
      product,
      qtyChange,
      userId,
    };
    writeInventoryLog([entry, ...entries]);
    bump();
  };

  /**
   * Log a bardana column change with column name, previous and new qty.
   */
  const logBardanaChange = (
    plant: string,
    product: string,
    column: string,
    previousQty: number,
    newQty: number,
    userId: string,
  ): void => {
    if (previousQty === newQty) return;
    const entries = prune(readBardanaLog());
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
    writeBardanaLog([entry, ...entries]);
    bump();
  };

  const getInventoryLog = (): InventoryLogEntry[] =>
    prune(readInventoryLog()).sort((a, b) => b.timestamp - a.timestamp);

  const getBardanaLog = (): BardanaLogEntry[] =>
    prune(readBardanaLog()).sort((a, b) => b.timestamp - a.timestamp);

  return {
    logInventoryChange,
    logBardanaChange,
    getInventoryLog,
    getBardanaLog,
  };
}
