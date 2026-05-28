import { describe, expect, it } from "vitest";
import { WORKERS_PER_PLOT_FULL_TEND } from "./constants";
import { getTendingEfficiency } from "./taskHints";
import type { Plot } from "./types";

const createPlot = (id: number, state: Plot["state"], resting: boolean, soilHealth: number): Plot => ({
  id,
  name: `Plot ${id}`,
  soilHealth,
  cropType: "tobacco",
  state,
  yieldModifier: 1,
  resting,
});

const planted = (id: number): Plot => createPlot(id, "planted", false, 100);
const fallow = (id: number): Plot => createPlot(id, "fallow", false, 75);
const resting = (id: number): Plot => createPlot(id, "fallow", true, 75);

describe("getTendingEfficiency", () => {
  it("returns 0 when there are no plots", () => {
    expect(getTendingEfficiency(4, [])).toBe(0);
  });

  it("returns 0 when there are no planted plots (all fallow)", () => {
    expect(getTendingEfficiency(4, [fallow(1), fallow(2)])).toBe(0);
  });

  it("returns 0 when there are no planted plots (all resting)", () => {
    expect(getTendingEfficiency(4, [resting(1), resting(2)])).toBe(0);
  });

  it("returns 100 for full coverage of planted plots", () => {
    // 2 planted plots × 1.5 = 3 workers needed; supply exactly that
    const workers = Math.ceil(2 * WORKERS_PER_PLOT_FULL_TEND);
    expect(getTendingEfficiency(workers, [planted(1), planted(2)])).toBe(100);
  });

  it("ignores resting/fallow plots when calculating coverage", () => {
    // 2 resting + 1 planted: full coverage = 1 × 1.5 = 1.5 → ceil 2 workers for 100%
    const plots = [resting(1), resting(2), planted(3)];
    const workers = Math.ceil(1 * WORKERS_PER_PLOT_FULL_TEND);
    expect(getTendingEfficiency(workers, plots)).toBe(100);
  });

  it("returns partial coverage when workers are under the planted count", () => {
    // 4 planted × 1.5 = 6 needed; supply 3 → 50%
    const plots = [planted(1), planted(2), planted(3), planted(4)];
    expect(getTendingEfficiency(3, plots)).toBe(50);
  });

  it("clamps to 100 when workers exceed what is needed", () => {
    expect(getTendingEfficiency(99, [planted(1)])).toBe(100);
  });
});
