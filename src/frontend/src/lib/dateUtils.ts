/**
 * Date and formatting utility functions for the LS Group IMS frontend.
 */

/**
 * Converts a Date object to nanoseconds (BigInt) as expected by the Motoko backend.
 */
export function dateToNs(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

/**
 * Converts a nanosecond timestamp (BigInt or number) to a YYYY-MM-DD date string.
 */
export function nsToDateString(ns: bigint | number): string {
  const ms = typeof ns === "bigint" ? Number(ns) / 1_000_000 : ns / 1_000_000;
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date as a YYYY-MM-DD string (local time).
 */
export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a nanosecond timestamp as a human-readable IST (UTC+5:30) date-time string.
 * e.g. "05 Mar 2026, 14:30:22 IST"
 */
export function formatIST(ns: bigint | number): string {
  const ms = typeof ns === "bigint" ? Number(ns) / 1_000_000 : ns / 1_000_000;
  const date = new Date(ms);

  try {
    const formatted = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${formatted} IST`;
  } catch {
    // Fallback if Intl is unavailable
    const offset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(ms + offset);
    const fallback = ist.toISOString().replace("T", ", ").replace(".000Z", "");
    return `${fallback} IST`;
  }
}
