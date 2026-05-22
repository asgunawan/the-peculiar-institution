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
// Maintenance is available every season so idle workers always have useful work.
export const SEASON_TASKS = {
  Spring:  [TASKS.PLANTING,   TASKS.MAINTENANCE],
  Summer:  [TASKS.TENDING,    TASKS.MAINTENANCE],
  Fall:    [TASKS.HARVESTING, TASKS.MAINTENANCE],
  Winter:  [TASKS.CURING,     TASKS.MAINTENANCE],
};

// Soil health thresholds used by the UI for color-coding.
export const SOIL_THRESHOLDS = {
  GOOD: 60,
  WARN: 30,
};

// ── Tobacco tuning ──────────────────────────────────────────────────────────

// Pounds of raw tobacco produced per plot per Fall, at 100% soil health and
// full tending coverage. Scales down with soil health and under-tending.
export const BASE_YIELD_PER_PLOT = 2000; // lbs raw tobacco

// Soil health lost per plot each harvest. Monoculture tobacco is brutal on soil.
export const SOIL_DEGRADE_PER_HARVEST = 15;

// Soil health restored per maintenance worker each Winter.
export const SOIL_RESTORE_PER_WORKER = 5;

// Raw-to-cured conversion: 2 lbs raw → 1 lb cured.
// Historical: tobacco curing (air-cure/flue-cure) loses ~half the weight.
export const CURING_RATIO = 2; // raw lbs needed per 1 cured lb

// Winter curing throughput per worker (raw lbs each season).
// Round number: 1 plot = 2,000 lbs raw → needs 2 curing workers to fully process it.
export const CURING_CAPACITY_PER_WORKER = 1000;

// Workers needed per plot for full tending coverage.
// Below this ratio, yield modifier degrades linearly.
export const WORKERS_PER_PLOT_FULL_TEND = 1.5;

// ── Tobacco price curve ─────────────────────────────────────────────────────
// Prices in cents per pound of CURED tobacco.
//
// Historical direction: suppressed prices early in the 1780s, then modest
// recovery after 1783.
export const TOBACCO_PRICE_CURVE = [
  { fromYear: 1780, price: 4 },
  { fromYear: 1783, price: 6 },
];

// Small random variance added/subtracted from price each season sale.
export const PRICE_VARIANCE_CENTS = 0.75;

// ── Economy ─────────────────────────────────────────────────────────────────
export const WORKER_COST = 200;  // dollars to buy one additional worker
export const PLOT_COST = 150;    // dollars to buy one additional plot

// Ordered field names used when acquiring additional plots.
export const FIELD_NAMES = [
  "Home Field",
  "North Quarter",
  "River Bottom",
  "Back Forty",
  "Oak Ridge",
  "Creek Side",
  "Sandy Loam",
  "Pine Hollow",
  "Red Clay",
  "Bottom Acre",
  "Hilltop",
  "Marsh Edge",
  "East Clearing",
  "West Hollow",
  "Stone Row",
];

// Ongoing per-worker seasonal upkeep (food, clothing, basic care).
// Applied every Winter as recurring financial pressure.
export const SEASONAL_WORKER_UPKEEP = 7;

// Consecutive seasons in debt before foreclosure if no inventory remains.
export const DEBT_FORECLOSURE_SEASONS = 2;

// ── Starting conditions ─────────────────────────────────────────────────────
export const STARTING_MONEY = 500;
export const STARTING_WORKERS = 4;
export const STARTING_PLOTS = 1;
export const START_YEAR = 1780;

// Year the cotton gin becomes available (victory/transition condition).
export const COTTON_GIN_YEAR = 1793;
