import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a nanosecond timestamp (bigint) to IST date/time string.
 */
export function formatIST(timestampNs: bigint): string {
  const ms = Number(timestampNs / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Convert a Date object to nanoseconds since epoch (bigint) for backend.
 */
export function dateToNs(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

/**
 * Convert nanosecond timestamp to YYYY-MM-DD string for date inputs.
 */
export function nsToDateString(timestampNs: bigint): string {
  const ms = Number(timestampNs / BigInt(1_000_000));
  const date = new Date(ms);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Today's date as YYYY-MM-DD string.
 */
export function todayString(): string {
  return nsToDateString(dateToNs(new Date()));
}

/**
 * Sort products: descending by quantity, zero-stock items keep original order at bottom.
 */
export function sortProducts<T extends { name: string; quantity: number }>(
  products: T[],
  originalOrder: string[]
): T[] {
  const nonZero = products.filter((p) => p.quantity > 0).sort((a, b) => b.quantity - a.quantity);
  const zero = originalOrder
    .map((name) => products.find((p) => p.name === name && p.quantity === 0))
    .filter((p): p is T => p !== undefined);
  return [...nonZero, ...zero];
}
