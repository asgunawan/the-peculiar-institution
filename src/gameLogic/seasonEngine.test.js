import { describe, expect, it } from "vitest";
import { DEBT_FORECLOSURE_SEASONS } from "./constants.js";
import { createInitialState } from "./initialState.js";
import { resolveSeason } from "./seasonEngine.js";

function createState(overrides = {}) {
  const base = createInitialState();
  return {
    ...base,
    ...overrides,
    resources: {
      ...base.resources,
      ...(overrides.resources || {}),
    },
    assignments: {
      ...base.assignments,
      ...(overrides.assignments || {}),
    },
  };
}

describe("resolveSeason", () => {
  it("reaches victory when Winter 1792 advances to Spring 1793", () => {
    const state = createState({
      year: 1792,
      seasonIndex: 3,
      assignments: { curing: 0, maintenance: 0 },
      resources: { rawTobacco: 0, curedTobacco: 0 },
    });

    const next = resolveSeason(state);

    expect(next.year).toBe(1793);
    expect(next.seasonIndex).toBe(0);
    expect(next.victory).toBe(true);
  });

  it("does not log no-raw message when raw leaf rots", () => {
    const state = createState({
      seasonIndex: 3,
      resources: { rawTobacco: 100, curedTobacco: 0 },
      assignments: { curing: 0, maintenance: 0 },
    });

    const next = resolveSeason(state);
    const logText = next.log.map((entry) => entry.text).join("\n");

    expect(logText).toContain("uncured raw leaf rotted");
    expect(logText).not.toContain("No raw leaf to cure");
  });

  it("logs no-raw message when no raw leaf exists in Winter", () => {
    const state = createState({
      seasonIndex: 3,
      resources: { rawTobacco: 0, curedTobacco: 0 },
      assignments: { curing: 2, maintenance: 0 },
    });

    const next = resolveSeason(state);
    const logText = next.log.map((entry) => entry.text).join("\n");

    expect(logText).toContain("No raw leaf to cure");
  });

  it("forecloses after configured debt seasons when inventory is exhausted", () => {
    const state = createState({
      seasonIndex: 0,
      money: -5,
      debtSeasons: DEBT_FORECLOSURE_SEASONS - 1,
      resources: { rawTobacco: 0, curedTobacco: 0 },
    });

    const next = resolveSeason(state);

    expect(next.debtSeasons).toBe(DEBT_FORECLOSURE_SEASONS);
    expect(next.gameOver).toBe(true);
  });

  it("does not foreclose while inventory remains even if debt threshold is reached", () => {
    const state = createState({
      seasonIndex: 0,
      money: -5,
      debtSeasons: DEBT_FORECLOSURE_SEASONS - 1,
      resources: { rawTobacco: 0, curedTobacco: 50 },
    });

    const next = resolveSeason(state);

    expect(next.debtSeasons).toBe(DEBT_FORECLOSURE_SEASONS);
    expect(next.gameOver).toBe(false);
  });
});
