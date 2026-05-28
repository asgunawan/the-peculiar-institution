// saveSlotUtils.ts — Pure, testable helpers for named save-slot persistence.
// Nothing here touches localStorage or React — that lives in useSaveSlots.

import type { GameState, SavePayload, SlotMeta } from "./types";

export const SLOT_COUNT = 10;

// Local copy so this module is self-contained and easily testable.
const SEASON_NAMES = ["Spring", "Summer", "Fall", "Winter"];

/** localStorage key for a given slot index (0-based). */
export const slotKey = (i: number): string => `tpi-save-slot-${i}`;

/**
 * Serialize a game state + price into the slot save format.
 */
export function serializeSlot(state: GameState, currentPrice: number): SavePayload {
  return {
    state,
    currentPrice,
    savedAt: new Date().toISOString(),
    label: `${state.year} \u2013 ${SEASON_NAMES[state.seasonIndex] ?? "?"}`,
  };
}

function hasObjectShape(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

/**
 * Parse a raw localStorage string into save data.
 * Returns null if the data is absent or structurally invalid.
 */
export function parseSlotData(raw: string | null | undefined): SavePayload | null {
  if (!raw || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!hasObjectShape(parsed)) return null;

    const state = parsed.state;
    if (!hasObjectShape(state)) return null;
    if (typeof state.year !== "number") return null;
    if (!hasObjectShape(state.resources)) return null;
    if (!hasObjectShape(state.assignments)) return null;
    if (typeof parsed.currentPrice !== "number") return null;

    return {
      ...parsed,
      state: state as unknown as GameState,
      currentPrice: parsed.currentPrice,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : undefined,
      label: typeof parsed.label === "string" ? parsed.label : undefined,
    } as SavePayload;
  } catch {
    return null;
  }
}

/**
 * Extract lightweight display metadata from a raw localStorage string.
 * Returns null if empty/corrupt.
 */
export function readSlotMeta(raw: string | null | undefined): SlotMeta | null {
  const data = parseSlotData(raw);
  if (!data) return null;

  return {
    label:
      data.label ??
      `${data.state.year} \u2013 ${SEASON_NAMES[data.state.seasonIndex] ?? "?"}`,
    savedAt: data.savedAt ?? null,
    year: data.state.year,
    seasonIndex: data.state.seasonIndex,
  };
}

/**
 * Format a savedAt ISO string for compact display, e.g. "28 May, 14:05".
 */
export function formatSaveDate(iso: string | null | undefined): string {
  if (!iso) return "";

  try {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "short" });
    const time = d.toLocaleTimeString("default", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${day} ${month}, ${time}`;
  } catch {
    return "";
  }
}