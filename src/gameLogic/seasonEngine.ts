import {
  SEASONS,
  SEASON_TASKS,
  BASE_YIELD_PER_PLOT,
  SOIL_DEGRADE_PER_HARVEST,
  SOIL_RESTORE_PER_WORKER,
  FALLOW_RECOVERY_PER_SEASON,
  FALLOW_RECOVERY_CAP,
  CURING_RATIO,
  CURING_CAPACITY_PER_WORKER,
  WORKERS_PER_PLOT_FULL_TEND,
  TOBACCO_PRICE_CURVE,
  PRICE_VARIANCE_CENTS,
  ENSLAVED_UPKEEP_PER_SEASON,
  HIREOUT_INCOME_PER_WORKER,
  DEBT_FORECLOSURE_SEASONS,
  COTTON_GIN_YEAR,
} from "./constants";
import { pushLog as pushStructuredLog } from "./logUtils";
import type { Assignments, GameState, LogEntry, Plot, SeasonName, TaskName } from "./types";

function getTobaccoPrice(year: number): number {
  const entry = [...TOBACCO_PRICE_CURVE].reverse().find((e) => year >= e.fromYear);
  return entry ? entry.price : TOBACCO_PRICE_CURVE[0].price;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createLogWriter(initialLog: LogEntry[], initialCounter: number) {
  let log = Array.isArray(initialLog) ? [...initialLog] : [];
  let logCounter = Number.isFinite(initialCounter) && initialCounter > 0 ? initialCounter : 1;

  return {
    add(message: string) {
      const next = pushStructuredLog(log, logCounter, message);
      log = next.log;
      logCounter = next.logCounter;
    },
    snapshot(): { log: LogEntry[]; logCounter: number } {
      return { log, logCounter };
    },
  };
}

function clonePlots(plots: Plot[]): Plot[] {
  return plots.map((p) => ({ ...p }));
}

function resolveSpring(state: GameState): GameState {
  const plots = clonePlots(state.plots);
  const { planting } = state.assignments;
  const writer = createLogWriter(state.log, state.logCounter);
  let planted = 0;

  const fallowPlots = plots.filter((p) => p.state === "fallow");
  const restingPlots = fallowPlots.filter((p) => p.resting);
  const activeFallowPlots = fallowPlots.filter((p) => !p.resting);

  if (planting === 0) {
    writer.add("Spring — No workers assigned to planting. Fields lie idle.");
  } else if (activeFallowPlots.length === 0 && restingPlots.length > 0) {
    writer.add(
      `Spring — All available plots are set to rest. ${restingPlots.length} plot(s) recovering in fallow rotation.`
    );
  } else if (activeFallowPlots.length === 0) {
    writer.add("Spring — All plots already have standing crops.");
  } else {
    const plotsToPlant = Math.min(planting, activeFallowPlots.length);
    for (let i = 0; i < plotsToPlant; i++) {
      activeFallowPlots[i].state = "planted";
      activeFallowPlots[i].resting = false;
      planted++;
    }
    const restingNote = restingPlots.length > 0 ? ` ${restingPlots.length} plot(s) left to rest in fallow rotation.` : "";
    const unworkedNote =
      activeFallowPlots.length - plotsToPlant > 0
        ? ` ${activeFallowPlots.length - plotsToPlant} active plot(s) unplanted (not enough workers).`
        : "";
    writer.add(`Spring — ${planted} plot(s) planted with tobacco.${unworkedNote}${restingNote}`.trim());
  }

  const { log, logCounter } = writer.snapshot();
  return { ...state, plots, log, logCounter };
}

function resolveSummer(state: GameState): GameState {
  const plots = clonePlots(state.plots);
  const { tending } = state.assignments;
  const writer = createLogWriter(state.log, state.logCounter);

  const plantedPlots = plots.filter((p) => p.state === "planted");

  if (plantedPlots.length === 0) {
    writer.add("Summer — No planted crops to tend.");
    const { log, logCounter } = writer.snapshot();
    return { ...state, plots, log, logCounter };
  }

  const fullCoverageWorkers = plantedPlots.length * WORKERS_PER_PLOT_FULL_TEND;
  const modifier = clamp(tending / fullCoverageWorkers, 0.3, 1.0);

  plantedPlots.forEach((p) => {
    p.yieldModifier = modifier;
    p.state = "tended";
  });

  const pct = Math.round(modifier * 100);
  writer.add(
    `Summer — ${plantedPlots.length} plot(s) tended at ${pct}% efficiency. ${
      modifier < 1.0 ? `Assign ${Math.ceil(fullCoverageWorkers - tending)} more workers for full yield.` : "Full coverage achieved."
    }`
  );

  const { log, logCounter } = writer.snapshot();
  return { ...state, plots, log, logCounter };
}

function resolveFall(state: GameState): GameState {
  const plots = clonePlots(state.plots);
  const { harvesting } = state.assignments;
  const writer = createLogWriter(state.log, state.logCounter);
  let rawGained = 0;

  const readyPlots = plots.filter((p) => p.state === "tended" || p.state === "planted");

  if (readyPlots.length === 0) {
    writer.add("Fall — Nothing to harvest.");
    const { log, logCounter } = writer.snapshot();
    return { ...state, plots, log, logCounter };
  }

  if (harvesting === 0) {
    writer.add("Fall — No workers assigned to harvest. Crops wilt in the field.");
    readyPlots.forEach((p) => {
      p.state = "fallow";
      p.yieldModifier = 1.0;
    });
    const { log, logCounter } = writer.snapshot();
    return { ...state, plots, log, logCounter };
  }

  const plotsToHarvest = Math.min(harvesting, readyPlots.length);

  for (let i = 0; i < plotsToHarvest; i++) {
    const plot = readyPlots[i];
    const yieldModifier = plot.yieldModifier ?? 1.0;
    const soilFactor = plot.soilHealth / 100;
    const raw = Math.floor(BASE_YIELD_PER_PLOT * soilFactor * yieldModifier);
    rawGained += raw;

    plot.soilHealth = Math.max(0, plot.soilHealth - SOIL_DEGRADE_PER_HARVEST);
    plot.state = "fallow";
    plot.yieldModifier = 1.0;
  }

  for (let i = plotsToHarvest; i < readyPlots.length; i++) {
    readyPlots[i].state = "fallow";
    readyPlots[i].yieldModifier = 1.0;
  }

  writer.add(
    `Fall — Harvest complete. Gathered ${rawGained} lbs of raw tobacco leaf from ${plotsToHarvest} plot(s).${
      readyPlots.length > plotsToHarvest ? ` ${readyPlots.length - plotsToHarvest} plot(s) not reached — crop lost.` : ""
    }`
  );

  const resources = {
    ...state.resources,
    rawTobacco: state.resources.rawTobacco + rawGained,
  };

  const { log, logCounter } = writer.snapshot();
  return { ...state, plots, resources, log, logCounter };
}

function resolveWinter(state: GameState): GameState {
  const plots = clonePlots(state.plots);
  const { curing } = state.assignments;
  const writer = createLogWriter(state.log, state.logCounter);
  const { rawTobacco } = state.resources;
  let { curedTobacco } = state.resources;
  const upkeepCost = parseFloat(
    state.workers
      .reduce((sum, w) => sum + (w.type === "enslaved" ? ENSLAVED_UPKEEP_PER_SEASON : 0), 0)
      .toFixed(2)
  );
  const enslaved = state.workers.filter((w) => w.type === "enslaved").length;
  const moneyAfterUpkeep = parseFloat((state.money - upkeepCost).toFixed(2));

  writer.add(`Winter — Provisioning for ${enslaved} enslaved worker${enslaved !== 1 ? "s" : ""} cost $${upkeepCost.toFixed(2)}.`);

  const maxCanCure = curing * CURING_CAPACITY_PER_WORKER;
  const rawUsed = Math.min(rawTobacco, maxCanCure);
  const newCured = Math.floor(rawUsed / CURING_RATIO);
  const rawRotted = rawTobacco - rawUsed;

  curedTobacco += newCured;

  if (rawUsed > 0) {
    writer.add(`Winter — ${rawUsed} lbs of leaf cured into ${newCured} lbs of tobacco by ${curing} worker(s).`);
  }
  if (rawRotted > 0) {
    writer.add(`Winter — ${rawRotted} lbs of uncured raw leaf rotted. Assign more workers to curing next year.`);
  }
  if (rawUsed === 0 && rawRotted === 0) {
    writer.add("Winter — No raw leaf to cure.");
  }

  const resources = { rawTobacco: 0, curedTobacco };

  const maintenanceWorkers = state.assignments.maintenance || 0;
  if (maintenanceWorkers > 0 && plots.length > 0) {
    const totalRestore = maintenanceWorkers * SOIL_RESTORE_PER_WORKER;
    const restorePerPlot = totalRestore / plots.length;
    plots.forEach((p) => {
      p.soilHealth = clamp(p.soilHealth + restorePerPlot, 0, 100);
    });
    writer.add(
      `Winter — ${maintenanceWorkers} worker${maintenanceWorkers !== 1 ? "s" : ""} worked the dormant fields, restoring ~${Math.round(restorePerPlot)} soil health per plot.`
    );
  }

  if (state.year === COTTON_GIN_YEAR - 1) {
    writer.add(
      `Winter ${state.year} — A letter arrives from New Haven, Connecticut. A young inventor named Eli Whitney has built a machine that separates cotton fiber from seed in minutes. An era is ending. A new one begins.`
    );
  }

  const { log, logCounter } = writer.snapshot();

  return {
    ...state,
    money: moneyAfterUpkeep,
    plots,
    resources,
    log,
    logCounter,
  };
}

export function resolveSeason(state: GameState): GameState {
  const season = SEASONS[state.seasonIndex];
  let nextState: GameState;

  switch (season) {
    case "Spring":
      nextState = resolveSpring(state);
      break;
    case "Summer":
      nextState = resolveSummer(state);
      break;
    case "Fall":
      nextState = resolveFall(state);
      break;
    case "Winter":
      nextState = resolveWinter(state);
      break;
    default:
      nextState = { ...state };
  }

  const maintenanceWorkers = state.assignments.maintenance || 0;
  if (season !== "Winter" && maintenanceWorkers > 0) {
    const hireOutIncome = parseFloat((maintenanceWorkers * HIREOUT_INCOME_PER_WORKER).toFixed(2));
    const maintLog = pushStructuredLog(
      nextState.log,
      nextState.logCounter,
      `${season} — ${maintenanceWorkers} worker${maintenanceWorkers !== 1 ? "s" : ""} hired out to neighboring farms and performed general plantation work. $${hireOutIncome.toFixed(2)} received.`
    );
    nextState = {
      ...nextState,
      money: parseFloat((nextState.money + hireOutIncome).toFixed(2)),
      log: maintLog.log,
      logCounter: maintLog.logCounter,
    };
  }

  const recoverableFallowPlots = nextState.plots.filter(
    (p) => p.state === "fallow" && p.soilHealth < FALLOW_RECOVERY_CAP
  );
  if (recoverableFallowPlots.length > 0) {
    const recoveredPlots = clonePlots(nextState.plots);
    recoveredPlots.forEach((p) => {
      if (p.state === "fallow") {
        p.soilHealth = clamp(p.soilHealth + FALLOW_RECOVERY_PER_SEASON, 0, FALLOW_RECOVERY_CAP);
      }
    });
    nextState = { ...nextState, plots: recoveredPlots };
  }

  const nextSeasonIndex = (state.seasonIndex + 1) % SEASONS.length;
  const nextYear = nextSeasonIndex === 0 ? state.year + 1 : state.year;

  const debtSeasons = nextState.money < 0 ? (state.debtSeasons ?? 0) + 1 : 0;

  if (nextState.money < 0) {
    const debtLog = pushStructuredLog(
      nextState.log,
      nextState.logCounter,
      `Creditors' patience thins — debt season ${debtSeasons}/${DEBT_FORECLOSURE_SEASONS}. Raise cash before foreclosure.`
    );
    nextState.log = debtLog.log;
    nextState.logCounter = debtLog.logCounter;
  }

  const isBankrupt =
    debtSeasons >= DEBT_FORECLOSURE_SEASONS &&
    nextState.resources.curedTobacco === 0 &&
    nextState.resources.rawTobacco === 0;

  if (isBankrupt) {
    const bankruptLog = pushStructuredLog(
      nextState.log,
      nextState.logCounter,
      "The creditors have come. After repeated defaults and no leaf left to sell, the plantation is foreclosed."
    );
    nextState.log = bankruptLog.log;
    nextState.logCounter = bankruptLog.logCounter;
  }

  nextState = { ...nextState, workers: nextState.workers.filter((w) => w.type !== "free") };

  const nextSeasonName = SEASONS[nextSeasonIndex] as SeasonName;
  const nextActiveTasks = (SEASON_TASKS[nextSeasonName] ?? []) as TaskName[];
  const preservedAssignments: Record<keyof Assignments, number> = {
    planting: 0,
    tending: 0,
    harvesting: 0,
    curing: 0,
    maintenance: 0,
  };

  (Object.keys(nextState.assignments) as Array<keyof Assignments>).forEach((key) => {
    preservedAssignments[key] = Math.min(nextState.assignments[key] || 0, nextState.workers.length);
  });

  preservedAssignments.maintenance = Math.min(state.maintenanceTarget ?? 0, nextState.workers.length);

  let runningTotal = 0;
  nextActiveTasks.forEach((key) => {
    const k = key as keyof Assignments;
    const clamped = Math.min(preservedAssignments[k] || 0, nextState.workers.length - runningTotal);
    preservedAssignments[k] = Math.max(0, clamped);
    runningTotal += preservedAssignments[k];
  });

  return {
    ...nextState,
    seasonIndex: nextSeasonIndex,
    year: nextYear,
    assignments: preservedAssignments,
    debtSeasons,
    gameOver: isBankrupt,
    victory: nextState.victory || nextYear >= COTTON_GIN_YEAR,
  };
}

export function getSellPrice(year: number): number {
  const base = getTobaccoPrice(year);
  const variance = (Math.random() - 0.5) * 2 * PRICE_VARIANCE_CENTS;
  return Math.max(1, parseFloat((base + variance).toFixed(2)));
}
