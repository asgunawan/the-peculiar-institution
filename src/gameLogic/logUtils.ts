import type { LogEntry } from "./types";

const MAX_LOG_ENTRIES = 20;

type LegacyLogEntry = string | LogEntry;

/**
 * Returns the display text for a log entry that may be legacy string or object.
 */
export function getLogEntryText(entry: LegacyLogEntry): string {
  if (entry && typeof entry === "object" && "text" in entry) {
    return entry.text;
  }
  return String(entry ?? "");
}

/**
 * Normalizes legacy logs into object entries with stable IDs.
 */
export function normalizeLog(
  log: LegacyLogEntry[],
  fallbackStartId = 1
): { log: LogEntry[]; nextId: number } {
  const list = Array.isArray(log) ? log : [];
  let nextId = fallbackStartId;

  const normalized = list
    .filter((entry) => entry !== null && entry !== undefined)
    .slice(0, MAX_LOG_ENTRIES)
    .map((entry) => {
      if (entry && typeof entry === "object" && "id" in entry && "text" in entry) {
        const normalizedId = Number.isFinite(entry.id) ? entry.id : nextId++;
        nextId = Math.max(nextId, normalizedId + 1);
        return { id: normalizedId, text: String(entry.text) };
      }

      return { id: nextId++, text: String(entry) };
    });

  return { log: normalized, nextId };
}

/**
 * Prepends one message to the event log with a unique integer ID.
 */
export function pushLog(
  log: LogEntry[],
  logCounter: number,
  message: string
): { log: LogEntry[]; logCounter: number } {
  const safeCounter = Number.isFinite(logCounter) && logCounter > 0 ? logCounter : 1;
  const nextEntry = { id: safeCounter, text: message };
  return {
    log: [nextEntry, ...(Array.isArray(log) ? log : [])].slice(0, MAX_LOG_ENTRIES),
    logCounter: safeCounter + 1,
  };
}