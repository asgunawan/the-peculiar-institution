// runLogger.js
// Telemetry utility: records a snapshot before and after each season resolve.
// Not pure game logic — reads/writes localStorage and triggers file downloads.
// Safe in Node/test environments: all browser APIs are guarded.

const RUN_LOG_KEY = "tpi_run_log";

function _tryLoad() {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(RUN_LOG_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

let _log = _tryLoad();

/** Extract the fields worth logging from a gameState. */
function _snapshot(s) {
  return {
    money: s.money,
    workers: s.workers,
    plots: s.plots.map((p) => ({
      id: p.id,
      name: p.name,
      soilHealth: p.soilHealth,
      cropState: p.state,
      yieldModifier: p.yieldModifier,
    })),
    resources: { ...s.resources },
    assignments: { ...s.assignments },
    debtSeasons: s.debtSeasons ?? 0,
  };
}

/**
 * Record one season transition.
 * @param {object} before  gameState before resolveSeason
 * @param {object} after   gameState returned by resolveSeason
 */
export function logSeason(before, after) {
  const entry = {
    seq: _log.length,
    year: before.year,
    season: ["Spring", "Summer", "Fall", "Winter"][before.seasonIndex],
    before: _snapshot(before),
    after: {
      money: after.money,
      workers: after.workers,
      plots: after.plots.map((p) => ({
        id: p.id,
        name: p.name,
        soilHealth: p.soilHealth,
        cropState: p.state,
        yieldModifier: p.yieldModifier,
      })),
      resources: { ...after.resources },
      debtSeasons: after.debtSeasons ?? 0,
      gameOver: after.gameOver,
      victory: after.victory,
    },
  };

  _log.push(entry);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RUN_LOG_KEY, JSON.stringify(_log));
    } catch {
      // Ignore storage quota errors — telemetry is best-effort.
    }
  }
}

/** Return a copy of the full run log array. */
export function getLog() {
  return _log;
}

/** Wipe the log (call on new game). */
export function clearLog() {
  _log = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(RUN_LOG_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Trigger a JSON file download of the current run log.
 * Call from browser console: window.downloadRunLog()
 */
export function downloadLog() {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(_log, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tpi-run-${new Date().toISOString().slice(0, 16).replace("T", "_")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
