import { describe, it, expect } from "vitest";
import {
  SLOT_COUNT,
  slotKey,
  serializeSlot,
  parseSlotData,
  readSlotMeta,
} from "./saveSlotUtils.js";
import { createInitialState } from "./initialState.js";
import { normalizeSavedState } from "./saveNormalizer.js";

// ── serializeSlot ────────────────────────────────────────────────────────────

describe("serializeSlot", () => {
  it("produces the required top-level keys", () => {
    const state = createInitialState();
    const result = serializeSlot(state, 300);
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("currentPrice", 300);
    expect(result).toHaveProperty("savedAt");
    expect(result).toHaveProperty("label");
  });

  it("state reference is the same object passed in", () => {
    const state = createInitialState();
    expect(serializeSlot(state, 300).state).toBe(state);
  });

  it("auto-generates label from year and seasonIndex", () => {
    const state = { ...createInitialState(), year: 1785, seasonIndex: 2 };
    expect(serializeSlot(state, 250).label).toBe("1785 \u2013 Fall");
  });

  it("savedAt is a valid ISO 8601 string", () => {
    const result = serializeSlot(createInitialState(), 300);
    expect(() => new Date(result.savedAt).toISOString()).not.toThrow();
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("all four seasons produce distinct labels", () => {
    const base = createInitialState();
    const labels = [0, 1, 2, 3].map((si) =>
      serializeSlot({ ...base, seasonIndex: si }, 300).label
    );
    expect(new Set(labels).size).toBe(4);
  });
});

// ── parseSlotData ────────────────────────────────────────────────────────────

describe("parseSlotData", () => {
  it("returns null for null", () => expect(parseSlotData(null)).toBeNull());
  it("returns null for empty string", () => expect(parseSlotData("")).toBeNull());
  it("returns null for whitespace", () => expect(parseSlotData("   ")).toBeNull());
  it("returns null for malformed JSON", () => expect(parseSlotData("{bad")).toBeNull());

  it("returns null if state is missing", () => {
    expect(parseSlotData(JSON.stringify({ currentPrice: 300 }))).toBeNull();
  });

  it("returns null if state.year is not a number", () => {
    const bad = { state: { year: "1780", resources: {}, assignments: {} }, currentPrice: 300 };
    expect(parseSlotData(JSON.stringify(bad))).toBeNull();
  });

  it("returns null if state.resources is absent", () => {
    const bad = { state: { year: 1780, assignments: {} }, currentPrice: 300 };
    expect(parseSlotData(JSON.stringify(bad))).toBeNull();
  });

  it("returns null if state.assignments is absent", () => {
    const bad = { state: { year: 1780, resources: {} }, currentPrice: 300 };
    expect(parseSlotData(JSON.stringify(bad))).toBeNull();
  });

  it("returns parsed object for a valid serialized slot", () => {
    const raw = JSON.stringify(serializeSlot(createInitialState(), 350));
    const result = parseSlotData(raw);
    expect(result).not.toBeNull();
    expect(result.currentPrice).toBe(350);
  });

  it("preserves extra fields beyond the minimum schema", () => {
    const data = { ...serializeSlot(createInitialState(), 300), customField: "hello" };
    const result = parseSlotData(JSON.stringify(data));
    expect(result.customField).toBe("hello");
  });
});

// ── readSlotMeta ─────────────────────────────────────────────────────────────

describe("readSlotMeta", () => {
  it("returns null for null/empty/garbage input", () => {
    expect(readSlotMeta(null)).toBeNull();
    expect(readSlotMeta("")).toBeNull();
    expect(readSlotMeta("garbage")).toBeNull();
  });

  it("returns metadata for a valid save", () => {
    const state = { ...createInitialState(), year: 1788, seasonIndex: 1 };
    const meta = readSlotMeta(JSON.stringify(serializeSlot(state, 280)));
    expect(meta).not.toBeNull();
    expect(meta.year).toBe(1788);
    expect(meta.seasonIndex).toBe(1);
    expect(meta.label).toBe("1788 \u2013 Summer");
    expect(typeof meta.savedAt).toBe("string");
  });

  it("falls back to generating label when data.label is absent", () => {
    const state = { ...createInitialState(), year: 1790, seasonIndex: 3 };
    // Manually omit the label field
    const data = {
      state,
      currentPrice: 300,
      savedAt: new Date().toISOString(),
      // no label
    };
    const meta = readSlotMeta(JSON.stringify(data));
    expect(meta?.label).toBe("1790 \u2013 Winter");
  });
});

// ── Round-trip through normalizeSavedState ────────────────────────────────────

describe("round-trip: serialize \u2192 parse \u2192 normalize", () => {
  it("preserves year and money through the full cycle", () => {
    const original = { ...createInitialState(), year: 1784, money: 999.99 };
    const raw = JSON.stringify(serializeSlot(original, 320));
    const parsed = parseSlotData(raw);
    const restored = normalizeSavedState(parsed.state, createInitialState());
    expect(restored.year).toBe(1784);
    expect(restored.money).toBe(999.99);
  });

  it("normalizer backfills missing fields from an older save format", () => {
    const state = createInitialState();
    const partial = { ...state };
    delete partial.debtSeasons;
    const raw = JSON.stringify({
      state: partial,
      currentPrice: 300,
      savedAt: new Date().toISOString(),
      label: "1780 \u2013 Spring",
    });
    const parsed = parseSlotData(raw);
    const restored = normalizeSavedState(parsed.state, createInitialState());
    expect(typeof restored.debtSeasons).toBe("number");
  });

  it("normalizeSavedState preserves all 10 plots when present", () => {
    const state = createInitialState();
    // Add extra plots to simulate a mid-game save
    const extraPlots = Array.from({ length: 9 }, (_, i) => ({
      ...state.plots[0],
      id: i + 2,
      name: `Field ${i + 2}`,
    }));
    const richState = { ...state, plots: [...state.plots, ...extraPlots] };
    const raw = JSON.stringify(serializeSlot(richState, 300));
    const parsed = parseSlotData(raw);
    const restored = normalizeSavedState(parsed.state, createInitialState());
    expect(restored.plots).toHaveLength(10);
  });
});

// ── Constants ─────────────────────────────────────────────────────────────────

describe("constants and slotKey", () => {
  it("SLOT_COUNT is 10", () => expect(SLOT_COUNT).toBe(10));

  it("slotKey generates unique keys for all slots", () => {
    const keys = Array.from({ length: SLOT_COUNT }, (_, i) => slotKey(i));
    expect(new Set(keys).size).toBe(SLOT_COUNT);
  });

  it("slotKey keys are distinct strings containing the index", () => {
    expect(slotKey(0)).toContain("0");
    expect(slotKey(9)).toContain("9");
    expect(slotKey(0)).not.toBe(slotKey(1));
  });
});
