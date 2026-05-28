import type { GameState, SeasonName } from "./types";

const RUN_LOG_KEY = "tpi_run_log";

interface Snapshot {
  money: number;
  workers: number;
  enslavedCount: number;
  freeCount: number;
  plots: Array<{ id: number; name: string; soilHealth: number; cropState: string; yieldModifier: number }>;
  resources: GameState["resources"];
  assignments: GameState["assignments"];
  debtSeasons: number;
}

interface RunLogEntry {
  seq: number;
  year: number;
  season: SeasonName;
  before: Snapshot;
  after: Snapshot & { gameOver: boolean; victory: boolean };
}

function tryLoad(): RunLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(RUN_LOG_KEY);
    return saved ? (JSON.parse(saved) as RunLogEntry[]) : [];
  } catch {
    return [];
  }
}

let log: RunLogEntry[] = tryLoad();

function snapshot(s: GameState): Snapshot {
  return {
    money: s.money,
    workers: s.workers.length,
    enslavedCount: s.workers.filter((w) => w.type === "enslaved").length,
    freeCount: s.workers.filter((w) => w.type === "free").length,
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

export function logInitialState(state: GameState): void {
  // Insert the starting snapshot at position 0 (replacing any stale entry).
  // seq -1 distinguishes it from real season advances in the analysis script.
  const entry = {
    seq: -1,
    year: state.year,
    season: ["Spring", "Summer", "Fall", "Winter"][state.seasonIndex] as SeasonName,
    label: "START",
    start: snapshot(state),
  };

  // Replace any existing start entry or prepend.
  if (log.length > 0 && (log[0] as { seq: number }).seq === -1) {
    log[0] = entry as unknown as RunLogEntry;
  } else {
    log = [entry as unknown as RunLogEntry, ...log];
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RUN_LOG_KEY, JSON.stringify(log));
    } catch {
      // ignore
    }
  }
}

export function logSeason(before: GameState, after: GameState): void {
  const entry: RunLogEntry = {
    seq: log.length,
    year: before.year,
    season: ["Spring", "Summer", "Fall", "Winter"][before.seasonIndex] as SeasonName,
    before: snapshot(before),
    after: {
      ...snapshot(after),
      gameOver: after.gameOver,
      victory: after.victory,
    },
  };

  log.push(entry);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RUN_LOG_KEY, JSON.stringify(log));
    } catch {
      // Ignore storage quota errors — telemetry is best-effort.
    }
  }
}

export function getLog(): RunLogEntry[] {
  return log;
}

export function clearLog(): void {
  log = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(RUN_LOG_KEY);
    } catch {
      // ignore
    }
  }
}

export function downloadLog(): void {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(log, null, 2);
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