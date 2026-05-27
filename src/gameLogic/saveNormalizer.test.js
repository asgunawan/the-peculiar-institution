import { describe, expect, it } from "vitest";
import { normalizeSavedState } from "./saveNormalizer.js";
import { createInitialState } from "./initialState.js";

function makeSaved(overrides = {}) {
  const base = createInitialState();
  return { ...base, ...overrides };
}

describe("normalizeSavedState — workers migration", () => {
  it("converts a legacy integer workers field to an enslaved array", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ workers: 4 }), fresh);

    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.workers).toHaveLength(4);
    expect(result.workers.every((w) => w.type === "enslaved")).toBe(true);
    expect(result.workers.map((w) => w.id)).toEqual([1, 2, 3, 4]);
  });

  it("falls back to fresh workers when workers field is null", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ workers: null }), fresh);

    expect(result.workers).toEqual(fresh.workers);
  });

  it("falls back to fresh workers when workers field is an object", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ workers: { count: 3 } }), fresh);

    expect(result.workers).toEqual(fresh.workers);
  });

  it("passes through a valid workers array unchanged", () => {
    const fresh = createInitialState();
    const validWorkers = [
      { id: 1, type: "enslaved" },
      { id: 2, type: "free" },
    ];
    const result = normalizeSavedState(makeSaved({ workers: validWorkers }), fresh);

    expect(result.workers).toEqual(validWorkers);
  });

  it("integer workers: 0 produces an empty array", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ workers: 0 }), fresh);

    expect(result.workers).toEqual([]);
  });
});

describe("normalizeSavedState — plots migration", () => {
  it("backfills missing resting flag on plots with false", () => {
    const fresh = createInitialState();
    const plotWithoutResting = {
      id: 1,
      name: "Home Field",
      soilHealth: 90,
      cropType: "tobacco",
      state: "fallow",
      yieldModifier: 1.0,
      // no resting field
    };
    const result = normalizeSavedState(makeSaved({ plots: [plotWithoutResting] }), fresh);

    expect(result.plots[0].resting).toBe(false);
  });

  it("preserves resting: true on plots that already have it", () => {
    const fresh = createInitialState();
    const restingPlot = { ...fresh.plots[0], resting: true };
    const result = normalizeSavedState(makeSaved({ plots: [restingPlot] }), fresh);

    expect(result.plots[0].resting).toBe(true);
  });

  it("falls back to fresh plots when plots field is not an array", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ plots: null }), fresh);

    expect(result.plots).toEqual(fresh.plots);
  });
});

describe("normalizeSavedState — missing fields", () => {
  it("defaults missing debtSeasons to 0", () => {
    const fresh = createInitialState();
    const saved = makeSaved();
    delete saved.debtSeasons;
    const result = normalizeSavedState(saved, fresh);

    expect(result.debtSeasons).toBe(0);
  });

  it("preserves an existing debtSeasons value", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ debtSeasons: 2 }), fresh);

    expect(result.debtSeasons).toBe(2);
  });

  it("defaults missing maintenanceTarget to 0", () => {
    const fresh = createInitialState();
    const saved = makeSaved();
    delete saved.maintenanceTarget;
    const result = normalizeSavedState(saved, fresh);

    expect(result.maintenanceTarget).toBe(0);
  });

  it("preserves an existing maintenanceTarget value", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ maintenanceTarget: 3 }), fresh);

    expect(result.maintenanceTarget).toBe(3);
  });
});

describe("normalizeSavedState — log normalization", () => {
  it("converts legacy string log entries to {id, text} objects", () => {
    const fresh = createInitialState();
    const saved = makeSaved({ log: ["First entry", "Second entry"], logCounter: 1 });
    const result = normalizeSavedState(saved, fresh);

    expect(result.log[0]).toHaveProperty("id");
    expect(result.log[0]).toHaveProperty("text");
    expect(result.log[0].text).toBe("First entry");
  });

  it("passes through existing structured log entries unchanged", () => {
    const fresh = createInitialState();
    const saved = makeSaved({
      log: [{ id: 5, text: "Already structured" }],
      logCounter: 6,
    });
    const result = normalizeSavedState(saved, fresh);

    expect(result.log[0]).toEqual({ id: 5, text: "Already structured" });
  });

  it("handles an empty log without error", () => {
    const fresh = createInitialState();
    const result = normalizeSavedState(makeSaved({ log: [] }), fresh);

    expect(result.log).toEqual([]);
  });
});
