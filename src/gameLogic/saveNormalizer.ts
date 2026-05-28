import type { GameState, Plot, Worker } from "./types";
import { normalizeLog } from "./logUtils";

type PartialSavedState = Partial<GameState> & {
  workers?: Worker[] | number | unknown;
  plots?: Plot[] | unknown;
  log?: unknown;
  logCounter?: number;
};

export function normalizeSavedState(
  savedState: PartialSavedState,
  freshState: GameState
): GameState {
  let workers = savedState.workers;
  if (typeof workers === "number") {
    workers = Array.from({ length: workers }, (_, i) => ({ id: i + 1, type: "enslaved" as const }));
  } else if (!Array.isArray(workers)) {
    workers = freshState.workers;
  }

  const plots = Array.isArray(savedState.plots)
    ? savedState.plots.map((p) => {
        const plot = p as Plot;
        return { ...plot, resting: plot.resting ?? false };
      })
    : freshState.plots;

  const { log, nextId } = normalizeLog(
    Array.isArray(savedState.log) ? (savedState.log as Array<string | { id: number; text: string }>) : [],
    savedState.logCounter ?? 1
  );

  return {
    ...freshState,
    ...savedState,
    workers,
    plots,
    log,
    logCounter: nextId,
    debtSeasons: savedState.debtSeasons ?? 0,
    maintenanceTarget: savedState.maintenanceTarget ?? 0,
    pendingFlavorText: savedState.pendingFlavorText ?? null,
    seenMilestones: Array.isArray(savedState.seenMilestones) ? (savedState.seenMilestones as string[]) : [],
    priceModifier: typeof savedState.priceModifier === "number" ? savedState.priceModifier : 1.0,
  } as GameState;
}