// seasonEngine.js
// Pure function: takes the current gameState and returns the next gameState.
// No side effects. No React imports. Fully testable in isolation.
//
// Season resolution order:
//   Spring  → planting workers mark plots as "planted"
//   Summer  → tending workers set yield modifier per plot
//   Fall    → harvesting workers produce rawTobacco; soil degrades
//   Winter  → curing workers convert rawTobacco→curedTobacco (2:1)
//             maintenance workers restore soil health
//             any uncured rawTobacco rots at end of Winter

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
  DEBT_FORECLOSURE_SEASONS,
  COTTON_GIN_YEAR,
} from "./constants.js";
import { pushLog as pushStructuredLog } from "./logUtils.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the tobacco sell price (cents/lb) for a given year.
 * Uses the last curve entry whose fromYear <= year.
 */
function getTobaccoPrice(year) {
  const entry = [...TOBACCO_PRICE_CURVE]
    .reverse()
    .find((e) => year >= e.fromYear);
  return entry ? entry.price : TOBACCO_PRICE_CURVE[0].price;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createLogWriter(initialLog, initialCounter) {
  let log = Array.isArray(initialLog) ? [...initialLog] : [];
  let logCounter = Number.isFinite(initialCounter) && initialCounter > 0 ? initialCounter : 1;

  return {
    add(message) {
      const next = pushStructuredLog(log, logCounter, message);
      log = next.log;
      logCounter = next.logCounter;
    },
    snapshot() {
      return { log, logCounter };
    },
  };
}

// Deep-clone plots array so we never mutate input state.
function clonePlots(plots) {
  return plots.map((p) => ({ ...p }));
}

// ── Season resolvers ─────────────────────────────────────────────────────────

/**
 * Spring: workers plant available plots.
 * A plot must be "fallow" to be planted.
 * Workers are spread across fallow plots; any unworked fallow plots stay fallow.
 */
function resolveSpring(state) {
  const plots = clonePlots(state.plots);
  const { planting } = state.assignments;
  const writer = createLogWriter(state.log, state.logCounter);
  let planted = 0;

  const fallowPlots = plots.filter((p) => p.state === "fallow");

  if (planting === 0) {
    writer.add("Spring — No workers assigned to planting. Fields lie idle.");
  } else if (fallowPlots.length === 0) {
    writer.add("Spring — All plots already have standing crops.");
  } else {
    // Each planting worker can cover one plot. Extra workers are wasted.
    const plotsToPlant = Math.min(planting, fallowPlots.length);
    for (let i = 0; i < plotsToPlant; i++) {
      fallowPlots[i].state = "planted";
      planted++;
    }
    writer.add(
      `Spring — ${planted} plot(s) planted with tobacco. ${
        fallowPlots.length - planted > 0
          ? `${fallowPlots.length - planted} plot(s) left unplanted (not enough workers).`
          : ""
      }`.trim()
    );
  }

  const { log, logCounter } = writer.snapshot();
  return { ...state, plots, log, logCounter };
}

/**
 * Summer: tending workers improve yield on planted plots.
 * Yield modifier = clamp(workers / (plots * WORKERS_PER_PLOT_FULL_TEND), 0.3, 1.0).
 * Under-tended tobacco still produces something, but yield is reduced.
 */
function resolveSummer(state) {
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
      modifier < 1.0
        ? `Assign ${Math.ceil(fullCoverageWorkers - tending)} more workers for full yield.`
        : "Full coverage achieved."
    }`
  );

  const { log, logCounter } = writer.snapshot();
  return { ...state, plots, log, logCounter };
}

/**
 * Fall: harvesting workers bring in the crop.
 * Each harvested plot yields rawTobacco proportional to soilHealth × yieldModifier.
 * SoilHealth degrades by SOIL_DEGRADE_PER_HARVEST per harvested plot.
 * Plots return to "fallow" after harvest.
 */
function resolveFall(state) {
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
    // Plots revert to fallow even if unharvested.
    readyPlots.forEach((p) => {
      p.state = "fallow";
      p.yieldModifier = 1.0;
    });
    const { log, logCounter } = writer.snapshot();
    return { ...state, plots, log, logCounter };
  }

  // Each harvesting worker can cover one plot per season.
  const plotsToHarvest = Math.min(harvesting, readyPlots.length);

  for (let i = 0; i < plotsToHarvest; i++) {
    const plot = readyPlots[i];
    const yieldModifier = plot.yieldModifier ?? 1.0;
    const soilFactor = plot.soilHealth / 100;
    const raw = Math.floor(BASE_YIELD_PER_PLOT * soilFactor * yieldModifier);
    rawGained += raw;

    // Degrade soil
    plot.soilHealth = Math.max(0, plot.soilHealth - SOIL_DEGRADE_PER_HARVEST);
    plot.state = "fallow";
    plot.yieldModifier = 1.0;
  }

  // Any plots not reached by workers also go fallow unharvested.
  for (let i = plotsToHarvest; i < readyPlots.length; i++) {
    readyPlots[i].state = "fallow";
    readyPlots[i].yieldModifier = 1.0;
  }

  writer.add(
    `Fall — Harvest complete. Gathered ${rawGained} lbs of raw tobacco leaf from ${plotsToHarvest} plot(s).${
      readyPlots.length > plotsToHarvest
        ? ` ${readyPlots.length - plotsToHarvest} plot(s) not reached — crop lost.`
        : ""
    }`
  );

  const resources = {
    ...state.resources,
    rawTobacco: state.resources.rawTobacco + rawGained,
  };

  const { log, logCounter } = writer.snapshot();
  return { ...state, plots, resources, log, logCounter };
}

/**
 * Winter: two competing assignments.
 *  - Curing workers convert rawTobacco → curedTobacco (CURING_RATIO : 1).
 *  - Maintenance workers restore soil health (+SOIL_RESTORE_PER_WORKER per worker, spread evenly).
 *  - Any remaining rawTobacco rots at end of Winter.
 * Then advance to the next year/season.
 */
function resolveWinter(state) {
  const plots = clonePlots(state.plots);
  const { curing } = state.assignments;
  const writer = createLogWriter(state.log, state.logCounter);
  let { rawTobacco, curedTobacco } = state.resources;
  const upkeepCost = parseFloat(
    state.workers.reduce(
      (sum, w) => sum + (w.type === "enslaved" ? ENSLAVED_UPKEEP_PER_SEASON : 0),
      0
    ).toFixed(2)
  );
  const enslaved = state.workers.filter(w => w.type === "enslaved").length;
  const moneyAfterUpkeep = parseFloat((state.money - upkeepCost).toFixed(2));

  writer.add(
    `Winter — Provisioning for ${enslaved} enslaved worker${enslaved !== 1 ? "s" : ""} cost $${upkeepCost.toFixed(2)}.`
  );

  // ── Curing ─────────────────────────────────────────────────────────────
  const maxCanCure = curing * CURING_CAPACITY_PER_WORKER;
  const rawUsed = Math.min(rawTobacco, maxCanCure);
  const newCured = Math.floor(rawUsed / CURING_RATIO);
  const rawRotted = rawTobacco - rawUsed;

  curedTobacco += newCured;

  if (rawUsed > 0) {
    writer.add(
      `Winter — ${rawUsed} lbs of leaf cured into ${newCured} lbs of tobacco by ${curing} worker(s).`
    );
  }
  if (rawRotted > 0) {
    writer.add(
      `Winter — ${rawRotted} lbs of uncured raw leaf rotted. Assign more workers to curing next year.`
    );
  }
  if (rawUsed === 0 && rawRotted === 0) {
    writer.add("Winter — No raw leaf to cure.");
  }

  const resources = { rawTobacco: 0, curedTobacco };

  // ── Maintenance (Winter only: off-season soil restoration) ──────────────────
  // Tobacco-exhausted soil does not recover from labor alone. Winter fieldwork
  // (drainage, turning, wood ash) provides modest improvement but cannot overcome
  // the structural depletion from monoculture. The real answer is fallow rotation.
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

  // ── Check for victory (cotton gin) ──────────────────────────────────────
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

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Resolves the current season and returns the next gameState.
 * The returned state has seasonIndex and year already advanced.
 *
 * @param {object} state - current gameState (not mutated)
 * @returns {object} nextState
 */
export function resolveSeason(state) {
  const season = SEASONS[state.seasonIndex];
  let nextState;

  switch (season) {
    case "Spring":  nextState = resolveSpring(state);  break;
    case "Summer":  nextState = resolveSummer(state);  break;
    case "Fall":    nextState = resolveFall(state);    break;
    case "Winter":  nextState = resolveWinter(state);  break;
    default:        nextState = { ...state };
  }

  // Growing-season maintenance: workers tend fences, clear brush, dig drainage.
  // No direct soil restoration in Spring/Summer/Fall — tobacco-exhausted Chesapeake
  // soil did not recover from growing-season labor. Winter fieldwork (handled inside
  // resolveWinter) and fallow rotation are the only two paths to recovery in 1780.
  const maintenanceWorkers = state.assignments.maintenance || 0;
  if (season !== "Winter" && maintenanceWorkers > 0) {
    const maintLog = pushStructuredLog(
      nextState.log,
      nextState.logCounter,
      `${season} — ${maintenanceWorkers} worker${maintenanceWorkers !== 1 ? "s" : ""} tended fences and cleared brush. Soil restoration is off-season work.`
    );
    nextState = {
      ...nextState,
      log: maintLog.log,
      logCounter: maintLog.logCounter,
    };
  }

  // ── Passive fallow recovery (every season) ────────────────────────────────
  // Plots left unplanted slowly recover soil health through natural rest.
  // This is the primary soil-restoration mechanic available to a 1780 Virginia
  // planter: leave exhausted land fallow for several seasons and let it recover.
  // Recovery is capped at FALLOW_RECOVERY_CAP — tobacco-exhausted ground rarely
  // returns to virgin productivity without moving to genuinely fresh land.
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

  // Advance calendar
  const nextSeasonIndex = (state.seasonIndex + 1) % SEASONS.length;
  const nextYear = nextSeasonIndex === 0 ? state.year + 1 : state.year;

  // Debt pressure: falling below $0 starts a foreclosure clock.
  // If no inventory exists to recover from debt for multiple seasons, game over.
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

  // Seasonal free workers return home after each season — they were paid at hire time.
  nextState = { ...nextState, workers: nextState.workers.filter(w => w.type !== "free") };

  // Preserve each task assignment as player preference memory. Only active
  // next-season tasks are constrained against each other for budget safety.
  const nextSeasonName = SEASONS[nextSeasonIndex];
  const nextActiveTasks = (SEASON_TASKS[nextSeasonName] ?? []);
  const preservedAssignments = {};
  Object.keys(nextState.assignments).forEach((key) => {
    // Clamp each remembered task to worker count in case workers changed.
    preservedAssignments[key] = Math.min(nextState.assignments[key] || 0, nextState.workers.length);
  });

  // Restore the player's explicit maintenance preference instead of inheriting
  // the previous season's value (e.g. Winter all-curing sets maintenance to 0).
  preservedAssignments["maintenance"] = Math.min(state.maintenanceTarget ?? 0, nextState.workers.length);

  // Clamp each active task so the total doesn't exceed workers.
  let runningTotal = 0;
  nextActiveTasks.forEach((key) => {
    const clamped = Math.min(preservedAssignments[key] || 0, nextState.workers.length - runningTotal);
    preservedAssignments[key] = Math.max(0, clamped);
    runningTotal += preservedAssignments[key];
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

/**
 * Calculates the current sell price for cured tobacco with a small random variance.
 * @param {number} year
 * @returns {number} price in cents per lb
 */
export function getSellPrice(year) {
  const base = getTobaccoPrice(year);
  const variance = (Math.random() - 0.5) * 2 * PRICE_VARIANCE_CENTS;
  return Math.max(1, parseFloat((base + variance).toFixed(2)));
}
