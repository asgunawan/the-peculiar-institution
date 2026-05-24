import { useCallback } from "react";
import {
  CURING_RATIO,
  SEASONS,
  SEASON_TASKS,
} from "../gameLogic/constants.js";
import { resolveSeason, getSellPrice } from "../gameLogic/seasonEngine.js";
import { logSeason } from "../gameLogic/runLogger.js";

/**
 * Advances the game by one season with assignment validation and outcome toasts.
 */
export function useSeasonAdvance({ state, setState, setCurrentPrice, addToast }) {
  const handleAdvanceSeason = useCallback(() => {
    const currentSeason = SEASONS[state.seasonIndex];
    const currentActiveTasks = SEASON_TASKS[currentSeason] ?? [];
    const assignedNow = currentActiveTasks.reduce(
      (sum, task) => sum + (state.assignments[task] || 0),
      0
    );
    const unassignedWorkersNow = Math.max(0, state.workers - assignedNow);

    if (unassignedWorkersNow > 0) {
      const proceed = window.confirm(
        `You still have ${unassignedWorkersNow} unassigned worker(s). Continue to next season anyway?`
      );
      if (!proceed) return;
    }

    const next = resolveSeason(state);
    logSeason(state, next);
    const rawGained = next.resources.rawTobacco - state.resources.rawTobacco;
    const curedGained = next.resources.curedTobacco - state.resources.curedTobacco;
    const moneyDelta = next.money - state.money;

    if (rawGained > 0) {
      addToast(`+${rawGained.toLocaleString()} lbs raw leaf`, "accent");
    }
    if (curedGained > 0) {
      addToast(`+${curedGained.toLocaleString()} lbs cured`, "green");
    }

    if (currentSeason === "Winter") {
      const rawUsedForCuring = Math.max(0, curedGained) * CURING_RATIO;
      const rawRotted = Math.max(
        0,
        state.resources.rawTobacco - rawUsedForCuring - next.resources.rawTobacco
      );
      if (rawRotted > 0) {
        addToast(`-${rawRotted.toLocaleString()} lbs rotted`, "red");
      }
    }

    if (moneyDelta < 0) {
      addToast(`-$${Math.abs(moneyDelta).toFixed(2)} upkeep`, "red");
    }

    setState(next);
    setCurrentPrice(getSellPrice(next.year));
  }, [state, setState, setCurrentPrice, addToast]);

  return { handleAdvanceSeason };
}
