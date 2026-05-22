// constants.js
// Static game data: seasons, crop definitions, price curves, and tuning values.
// All "magic numbers" live here so the season engine stays readable.

export const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

// Tasks that workers can be assigned to. Season engine validates that each
// season only processes relevant tasks.
export const TASKS = {
  PLANTING: "planting",
  TENDING: "tending",
  HARVESTING: "harvesting",
  CURING: "curing",
  MAINTENANCE: "maintenance",
};

// Which tasks are active in each season (others are ignored during resolution).
export const SEASON_TASKS = {
  Spring: [TASKS.PLANTING],
  Summer: [TASKS.TENDING],
  Fall: [TASKS.HARVESTING],
  Winter: [TASKS.CURING, TASKS.MAINTENANCE],
};

// Soil health thresholds used by the UI for color-coding.
export const SOIL_THRESHOLDS = {
  GOOD: 60,
  WARN: 30,
};

// ── Tobacco tuning ──────────────────────────────────────────────────────────

// Pounds of raw tobacco produced per plot per Fall, at 100% soil health and
// full tending coverage. Scales down with soil health and under-tending.
export const BASE_YIELD_PER_PLOT = 40; // lbs raw tobacco

// Soil health lost per plot each harvest. Monoculture tobacco is brutal on soil.
export const SOIL_DEGRADE_PER_HARVEST = 15;

// Soil health restored per maintenance worker each Winter.
export const SOIL_RESTORE_PER_WORKER = 5;

// Raw-to-cured conversion: 2 lbs raw → 1 lb cured.
// Historical: tobacco curing (air-cure/flue-cure) loses ~half the weight.
export const CURING_RATIO = 2; // raw lbs needed per 1 cured lb

// Workers needed per plot for full tending coverage.
// Below this ratio, yield modifier degrades linearly.
export const WORKERS_PER_PLOT_FULL_TEND = 1.5;

// ── Tobacco price curve ─────────────────────────────────────────────────────
// Prices in cents per pound of CURED tobacco.
//
// Historical basis:
//   1780–1782: Suppressed (~4¢) — active Revolutionary War, British trade cut off.
//   1783–1792: Recovery (~6¢) — peace, European markets reopen.
//
// The push toward cotton (1793+) is the CARROT: cotton's dramatically higher
// profit potential, not a tobacco price crash. The soil-depletion mechanic
// provides the natural pressure during the tobacco phase.
export const TOBACCO_PRICE_CURVE = [
  { fromYear: 1780, price: 4 },
  { fromYear: 1783, price: 6 },
];

// Small random variance added/subtracted from price each season sale.
export const PRICE_VARIANCE_CENTS = 0.5;

// ── Economy ─────────────────────────────────────────────────────────────────
export const WORKER_COST = 200;  // dollars to buy one additional worker
export const PLOT_COST = 150;    // dollars to buy one additional plot

// ── Starting conditions ─────────────────────────────────────────────────────
export const STARTING_MONEY = 500;
export const STARTING_WORKERS = 4;
export const STARTING_PLOTS = 1;
export const START_YEAR = 1780;

// Year the cotton gin becomes available (victory/transition condition).
export const COTTON_GIN_YEAR = 1793;
