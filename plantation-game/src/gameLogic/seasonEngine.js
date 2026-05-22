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
  TASKS,
  BASE_YIELD_PER_PLOT,
  SOIL_DEGRADE_PER_HARVEST,
  SOIL_RESTORE_PER_WORKER,
  CURING_RATIO,
  WORKERS_PER_PLOT_FULL_TEND,
  TOBACCO_PRICE_CURVE,
  COTTON_GIN_YEAR,
} from "./constants.js";

const MAX_LOG_ENTRIES = 20;

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

function pushLog(log, message) {
  return [message, ...log].slice(0, MAX_LOG_ENTRIES);
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
  let log = [...state.log];
  let planted = 0;

  const fallowPlots = plots.filter((p) => p.state === "fallow");

  if (planting === 0) {
    log = pushLog(log, "Spring — No workers assigned to planting. Fields lie idle.");
  } else if (fallowPlots.length === 0) {
    log = pushLog(log, "Spring — All plots already have standing crops.");
  } else {
    // Each planting worker can cover one plot. Extra workers are wasted.
    const plotsToPlant = Math.min(planting, fallowPlots.length);
    for (let i = 0; i < plotsToPlant; i++) {
      fallowPlots[i].state = "planted";
      planted++;
    }
    log = pushLog(
      log,
      `Spring — ${planted} plot(s) planted with tobacco. ${
        fallowPlots.length - planted > 0
          ? `${fallowPlots.length - planted} plot(s) left unplanted (not enough workers).`
          : ""
      }`.trim()
    );
  }

  return { ...state, plots, log };
}

/**
 * Summer: tending workers improve yield on planted plots.
 * Yield modifier = clamp(workers / (plots * WORKERS_PER_PLOT_FULL_TEND), 0.3, 1.0).
 * Under-tended tobacco still produces something, but yield is reduced.
 */
function resolveSummer(state) {
  const plots = clonePlots(state.plots);
  const { tending } = state.assignments;
  let log = [...state.log];

  const plantedPlots = plots.filter((p) => p.state === "planted");

  if (plantedPlots.length === 0) {
    log = pushLog(log, "Summer — No planted crops to tend.");
    return { ...state, plots, log };
  }

  const fullCoverageWorkers = plantedPlots.length * WORKERS_PER_PLOT_FULL_TEND;
  const modifier = clamp(tending / fullCoverageWorkers, 0.3, 1.0);

  plantedPlots.forEach((p) => {
    p.yieldModifier = modifier;
    p.state = "tended";
  });

  const pct = Math.round(modifier * 100);
  log = pushLog(
    log,
    `Summer — ${plantedPlots.length} plot(s) tended at ${pct}% efficiency. ${
      modifier < 1.0
        ? `Assign ${Math.ceil(fullCoverageWorkers - tending)} more workers for full yield.`
        : "Full coverage achieved."
    }`
  );

  return { ...state, plots, log };
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
  let log = [...state.log];
  let rawGained = 0;

  const readyPlots = plots.filter((p) => p.state === "tended" || p.state === "planted");

  if (readyPlots.length === 0) {
    log = pushLog(log, "Fall — Nothing to harvest.");
    return { ...state, plots, log };
  }

  if (harvesting === 0) {
    log = pushLog(log, "Fall — No workers assigned to harvest. Crops wilt in the field.");
    // Plots revert to fallow even if unharvested.
    readyPlots.forEach((p) => {
      p.state = "fallow";
      p.yieldModifier = 1.0;
    });
    return { ...state, plots, log };
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

  log = pushLog(
    log,
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

  return { ...state, plots, resources, log };
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
  const { curing, maintenance } = state.assignments;
  let log = [...state.log];
  let { rawTobacco, curedTobacco } = state.resources;

  // ── Curing ─────────────────────────────────────────────────────────────
  // Each curing worker can process 20 lbs of raw leaf per season.
  const CURING_CAPACITY_PER_WORKER = 20;
  const maxCanCure = curing * CURING_CAPACITY_PER_WORKER;
  const rawUsed = Math.min(rawTobacco, maxCanCure);
  const newCured = Math.floor(rawUsed / CURING_RATIO);
  const rawRotted = rawTobacco - rawUsed;

  curedTobacco += newCured;
  rawTobacco = 0; // All remaining raw rots at end of winter.

  if (rawUsed > 0) {
    log = pushLog(
      log,
      `Winter — ${rawUsed} lbs of leaf cured into ${newCured} lbs of tobacco by ${curing} worker(s).`
    );
  }
  if (rawRotted > 0) {
    log = pushLog(
      log,
      `Winter — ${rawRotted} lbs of uncured raw leaf rotted. Assign more workers to curing next year.`
    );
  }
  if (rawUsed === 0 && rawTobacco === 0) {
    log = pushLog(log, "Winter — No raw leaf to cure.");
  }

  // ── Maintenance ─────────────────────────────────────────────────────────
  if (maintenance > 0 && plots.length > 0) {
    const totalRestore = maintenance * SOIL_RESTORE_PER_WORKER;
    const restorePerPlot = totalRestore / plots.length;
    plots.forEach((p) => {
      p.soilHealth = clamp(p.soilHealth + restorePerPlot, 0, 100);
    });
    log = pushLog(
      log,
      `Winter — ${maintenance} worker(s) tended the fields, restoring ~${Math.round(restorePerPlot)} soil health per plot.`
    );
  }

  const resources = { rawTobacco: 0, curedTobacco };

  // ── Check for victory (cotton gin) ──────────────────────────────────────
  const nextYear = state.year + 1;
  if (state.year === COTTON_GIN_YEAR - 1) {
    log = pushLog(
      log,
      `Winter ${state.year} — A letter arrives from New Haven, Connecticut. A young inventor named Eli Whitney has built a machine that separates cotton fiber from seed in minutes. An era is ending. A new one begins.`
    );
  }

  return {
    ...state,
    plots,
    resources,
    log,
    victory: state.year >= COTTON_GIN_YEAR,
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

  // Advance calendar
  const nextSeasonIndex = (state.seasonIndex + 1) % SEASONS.length;
  const nextYear = nextSeasonIndex === 0 ? state.year + 1 : state.year;

  // Bankruptcy: no money and no sellable product and no raw leaf to cure.
  const isBankrupt =
    nextState.money <= 0 &&
    nextState.resources.curedTobacco === 0 &&
    nextState.resources.rawTobacco === 0;

  if (isBankrupt) {
    nextState.log = pushLog(
      nextState.log,
      "The creditors have come. With no tobacco to sell and no money left, the plantation is lost."
    );
  }

  return {
    ...nextState,
    seasonIndex: nextSeasonIndex,
    year: nextYear,
    // Reset assignments for next season
    assignments: {
      planting: 0,
      tending: 0,
      harvesting: 0,
      curing: 0,
      maintenance: 0,
    },
    gameOver: isBankrupt,
  };
}

/**
 * Calculates the current sell price for cured tobacco with a small random variance.
 * @param {number} year
 * @returns {number} price in cents per lb
 */
export function getSellPrice(year) {
  const base = getTobaccoPrice(year);
  const variance = (Math.random() - 0.5) * 2 * 0.5; // ±0.5¢
  return Math.max(1, parseFloat((base + variance).toFixed(2)));
}
