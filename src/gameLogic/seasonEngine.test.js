import { describe, expect, it } from "vitest";
import { DEBT_FORECLOSURE_SEASONS, ENSLAVED_UPKEEP_PER_SEASON } from "./constants.js";
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

  it("free workers do not contribute to Winter upkeep cost", () => {
    const startMoney = 500;

    const enslaved = createState({
      seasonIndex: 3, // Winter — upkeep is deducted
      money: startMoney,
      workers: [{ id: 1, type: "enslaved" }],
      assignments: { curing: 0, maintenance: 0 },
      resources: { rawTobacco: 0, curedTobacco: 0 },
    });

    const mixed = createState({
      seasonIndex: 3,
      money: startMoney,
      workers: [{ id: 1, type: "enslaved" }, { id: 2, type: "free" }],
      assignments: { curing: 0, maintenance: 0 },
      resources: { rawTobacco: 0, curedTobacco: 0 },
    });

    const nextEnslaved = resolveSeason(enslaved);
    const nextMixed = resolveSeason(mixed);

    // Free workers are paid at hire — only enslaved upkeep is deducted in Winter.
    expect(startMoney - nextEnslaved.money).toBe(ENSLAVED_UPKEEP_PER_SEASON);
    expect(startMoney - nextMixed.money).toBe(ENSLAVED_UPKEEP_PER_SEASON);
  });

  it("free workers are removed from workforce after each season resolves", () => {
    const state = createState({
      seasonIndex: 0, // Spring
      workers: [
        { id: 1, type: "enslaved" },
        { id: 2, type: "free" },
        { id: 3, type: "free" },
      ],
      assignments: { planting: 0, tending: 0, harvesting: 0, curing: 0, maintenance: 0 },
    });

    const next = resolveSeason(state);

    expect(next.workers.length).toBe(1);
    expect(next.workers[0].type).toBe("enslaved");
  });

  it("mixed workforce only charges enslaved upkeep in Winter", () => {
    const startMoney = 500;
    const state = createState({
      seasonIndex: 3,
      money: startMoney,
      workers: [
        { id: 1, type: "enslaved" },
        { id: 2, type: "enslaved" },
        { id: 3, type: "free" },
      ],
      assignments: { curing: 0, maintenance: 0 },
      resources: { rawTobacco: 0, curedTobacco: 0 },
    });

    const next = resolveSeason(state);
    const expectedCost = 2 * ENSLAVED_UPKEEP_PER_SEASON;

    expect(parseFloat((startMoney - next.money).toFixed(2))).toBe(expectedCost);
  });
});
