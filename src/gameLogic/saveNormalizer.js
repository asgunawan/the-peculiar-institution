// saveNormalizer.js
// Pure function that migrates and fills gaps in a saved state object.
// Called by useGameSession when loading from localStorage.
// Kept pure (no localStorage calls) so it can be unit-tested independently.

import { normalizeLog } from "./logUtils.js";

/**
 * Takes a raw parsed state from localStorage and returns a normalized version
 * safe to pass to useState. Handles:
 *   - workers stored as a legacy integer (pre-typed-workforce format)
 *   - missing debtSeasons / maintenanceTarget fields added in later versions
 *   - missing plots[n].resting field added with fallow rotation feature
 *   - log normalization (string → {id,text} entries)
 *
 * @param {object} savedState - Raw state object from localStorage
 * @param {object} freshState - A fresh state from createInitialState(), used as fallback
 * @returns {object} Normalized state
 */
export function normalizeSavedState(savedState, freshState) {
  // Workers migration: legacy saves stored workers as a plain integer.
  let workers = savedState.workers;
  if (typeof workers === "number") {
    workers = Array.from({ length: workers }, (_, i) => ({ id: i + 1, type: "enslaved" }));
  } else if (!Array.isArray(workers)) {
    workers = freshState.workers;
  }

  // Plots migration: backfill the `resting` flag introduced with fallow rotation.
  const plots = Array.isArray(savedState.plots)
    ? savedState.plots.map((p) => ({ resting: false, ...p }))
    : freshState.plots;

  // Log normalization: convert any legacy string entries to {id, text} objects.
  const { log, nextId } = normalizeLog(savedState.log, savedState.logCounter ?? 1);

  return {
    ...savedState,
    workers,
    plots,
    log,
    logCounter: nextId,
    debtSeasons: savedState.debtSeasons ?? 0,
    maintenanceTarget: savedState.maintenanceTarget ?? 0,
  };
}
