// constants.ts
// Static game data: seasons, crop definitions, price curves, and tuning values.
// All "magic numbers" live here so the season engine stays readable.

import type { SeasonName, TaskName } from "./types";

export const SEASONS: SeasonName[] = ["Spring", "Summer", "Fall", "Winter"];

// Tasks that workers can be assigned to. Season engine validates that each
// season only processes relevant tasks.
export const TASKS = {
  PLANTING: "planting",
  TENDING: "tending",
  HARVESTING: "harvesting",
  CURING: "curing",
  MAINTENANCE: "maintenance",
} as const;

// Which tasks are active in each season (others are ignored during resolution).
// Maintenance is available every season so idle workers always have useful work.
export const SEASON_TASKS: Record<SeasonName, TaskName[]> = {
  Spring: [TASKS.PLANTING, TASKS.MAINTENANCE],
  Summer: [TASKS.TENDING, TASKS.MAINTENANCE],
  Fall: [TASKS.HARVESTING, TASKS.MAINTENANCE],
  Winter: [TASKS.CURING, TASKS.MAINTENANCE],
};

// Soil health thresholds used by the UI for color-coding.
export const SOIL_THRESHOLDS = {
  GOOD: 60,
  WARN: 30,
} as const;

// ── Tobacco tuning ──────────────────────────────────────────────────────────

// Pounds of raw tobacco produced per plot per Fall, at 100% soil health and
// full tending coverage. Scales down with soil health and under-tending.
export const BASE_YIELD_PER_PLOT = 2000; // lbs raw tobacco

// Soil health lost per plot each harvest. Monoculture tobacco is brutal on soil.
// Historical calibration: Wikipedia (Tobacco in American colonies) cites Craven (1926):
// "Tobacco will wear out the soil in just a few years." Chesapeake consensus is
// 3-5 years of continuous planting to meaningful exhaustion, 5-7 to abandonment.
// At -20/harvest: yield ~60% by year 2, ~40% by year 3, exhausted by year 5 — matches.
export const SOIL_DEGRADE_PER_HARVEST = 20;

// Soil health restored per maintenance worker during Winter (off-season fieldwork only).
// Growing-season maintenance has no soil effect — exhausted tobacco land does not recover
// from labor alone. Historical note: Virginia planters had almost no effective soil
// restoration tools in 1780; fallow rotation was the primary (and slow) remedy.
export const SOIL_RESTORE_PER_WORKER = 4;

// Passive soil recovery per season for plots left fallow (not planted).
// Represents the slow natural recovery of rested land.
export const FALLOW_RECOVERY_PER_SEASON = 3;

// Fallow rotation cannot fully restore tobacco-exhausted land. A plot left fallow
// recovers to this ceiling at most. Fresh (purchased) plots start at 100 and can
// be maintained above this cap through active Winter labor.
// Historical note: Chesapeake planters found exhausted soil rarely returned to
// virgin productivity — the answer was to move west to fresh land.
export const FALLOW_RECOVERY_CAP = 75;

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
// Upfront purchase cost for an enslaved worker at auction.
export const ENSLAVED_PURCHASE_COST = 200; // dollars; gameplay-scaled (historical ~$300–600 in 1780s)
// Upfront cost to hire a free worker — none, but wages are ongoing.
export const FREE_WORKER_HIRE_COST = 0;
export const PLOT_COST = 150; // dollars to buy one additional plot

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

// Seasonal cost per enslaved worker (food, clothing, basic care).
export const ENSLAVED_UPKEEP_PER_SEASON = 7;
// Seasonal wage per free worker. Historically ~2x the cost of enslaved upkeep
// due to wage rates in the antebellum South. (concept.txt research: 2x labor cost)
export const FREE_WORKER_WAGE_PER_SEASON = 15;

// Gameplay-scaled: allow one extra recovery season before foreclosure when
// inventory is exhausted, so debt pressure is sustained but less abrupt.
export const DEBT_FORECLOSURE_SEASONS = 3;

// Growing-season income per maintenance worker per season (Spring/Summer/Fall).
// Represents the standard Chesapeake practice of hiring out surplus enslaved
// workers to neighboring planters and tradespeople during slack periods.
// The planter received the wages; the worker received nothing.
// Historical note: unskilled hire-out in 1780s Virginia ~$30–50/yr
// (~$7.50–12.50/quarter). $3/season is conservative for gameplay balance.
export const HIREOUT_INCOME_PER_WORKER = 3;

// ── Infrastructure ───────────────────────────────────────────────────────────
// Tier 1 (no cabins): planter & family supervise directly. Works at 1–6 workers.
export const BASE_HOUSING_CAPACITY = 6;
// Quarter Cabin Row: each cabin built adds this many worker housing slots.
// Historical: 1 cabin (~200 sq ft) housed ~4–6 workers. Built from plantation timber in Winter.
export const CABIN_HOUSING_CAPACITY = 6;
// Cash cost per cabin. Represents materials from local sawmill; labour is the workforce's.
// Gameplay-scaled down from historical lumber + ironwork costs (~$100+) for pacing.
export const CABIN_COST = 60;
// Tool Cache (Hoe Shed): one-time purchase from a passing trader.
// Historical: high-quality iron hoes were imported specifically for the Chesapeake tobacco trade.
export const TOOL_SHED_COST = 80;
// Yield multiplier from having proper iron tools (applied to raw harvest per plot).
export const TOOL_SHED_YIELD_BONUS = 0.10;
// Upkeep per enslaved worker when provision grounds are active (vs ENSLAVED_UPKEEP_PER_SEASON).
// Workers grow vegetables, keep chickens, fish on Sundays — partially self-provisioning.
// Historical: saves significant cash per worker; Virginia planters widely used this.
export const PROVISION_UPKEEP_PER_WORKER = 4;

// ── Starting conditions ─────────────────────────────────────────────────────
export const STARTING_MONEY = 500;
export const STARTING_WORKERS = 4;
export const STARTING_PLOTS = 1;
export const START_YEAR = 1780;

// Year the cotton gin becomes available (victory/transition condition).
export const COTTON_GIN_YEAR = 1793;

// ── Random events ─────────────────────────────────────────────────────────
// Events are checked once per season advance (not in preview mode).
// Only one event fires per season; events are tested in declaration order.

export interface RandomEvent {
  id: string;
  seasons: SeasonName[];
  chance: number; // probability 0–1
  label: string;
  logText: string; // written to the event log when fired
}

export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: "tobacco-blight",
    seasons: ["Summer"],
    chance: 0.12,
    label: "Tobacco Blight",
    logText:
      "EVENT — Tobacco Blight: A yellowing blight has spread through the rows this summer. Mosaic virus, black rot — there is no way to say. Tending efforts were partially undone and yield will be reduced. (Tobacco diseases were chronic in the Chesapeake. Mosaic virus, black shank, and root rot struck unpredictably; planters had no chemical remedies — only to pull diseased stalks and hope.)",
  },
  {
    id: "drought",
    seasons: ["Summer"],
    chance: 0.10,
    label: "Drought",
    logText:
      "EVENT — Drought: Weeks of punishing heat cracked the soil and wilted the young plants. The fields are stressed and the soil's condition has worsened. (The Chesapeake climate was volatile. Severe drought years struck in 1780, 1787, and 1791. Planters had no irrigation — they were entirely at the mercy of seasonal rainfall.)",
  },
  {
    id: "early-frost",
    seasons: ["Fall"],
    chance: 0.12,
    label: "Early Frost",
    logText:
      "EVENT — Early Frost: A hard frost arrived three weeks ahead of schedule, blackening the tobacco before it could fully ripen. A portion of the harvest is ruined. (An early autumn frost was among the most feared events in the tobacco calendar. Green, frost-damaged leaf was nearly unsaleable and fetched pennies on the pound — or nothing at all.)",
  },
  {
    id: "price-crash",
    seasons: ["Spring", "Summer", "Fall", "Winter"],
    chance: 0.08,
    label: "Market Price Crash",
    logText:
      "EVENT — Market Price Crash: Dispatches arrive from the merchant houses — tobacco prices have collapsed in British and Dutch markets. Overproduction and disrupted postwar trade have saturated buyers. Prices will recover, but not this season. (Virginia tobacco prices were notoriously volatile in the 1780s. The Revolutionary War's aftermath had disrupted the Atlantic trade for years; planters sold into a buyers' market at the worst moments.)",
  },
  {
    id: "good-harvest",
    seasons: ["Summer"],
    chance: 0.12,
    label: "Favorable Season",
    logText:
      "EVENT — Favorable Season: Mild rains and temperate weather have blessed the tobacco this summer. Growth is ahead of schedule and the leaf looks strong. (A 'favourable season' was the constant prayer of the Chesapeake planter. Washington and Jefferson kept detailed weather journals, noting that a single good season could rescue a plantation's finances.)",
  },
];

// ── First-occurrence flavor text ───────────────────────────────────────────
// Shown once in the header subtitle when a milestone is first triggered.
// Keyed by milestone ID; checked against state.seenMilestones.

export const SEASON_HINTS: Record<string, string> = {
  Spring: "Assign workers to planting.",
  Summer: "Assign workers to tending the fields.",
  Fall:   "Assign workers to harvesting.",
  Winter: "Split workers between curing and maintenance.",
};

export const FLAVOR_MILESTONES: Record<string, string> = {
  "soil-low":
    "The soil tells the story of Virginia's tobacco curse. Decades of continuous planting exhausted the Chesapeake tidewater. Most planters simply abandoned worn-out land and moved west — a cycle that pushed the frontier steadily toward the Appalachians.",
  "curing-shortfall":
    "Tobacco curing was a science unto itself. Chesapeake planters air-cured or fire-cured their leaf over weeks or months. Uncured raw leaf fermented and rotted quickly — what you could not cure, you lost entirely.",
  "first-debt":
    "Debt was the defining condition of the Virginia planter class. The crop was pledged before it was grown, and interest compounded through generations. George Washington never escaped his debts. Thomas Jefferson died $107,000 in arrears.",

  // Year-triggered historical notes — shown once when entering the new year's Spring.
  "year-1780":
    "Spring 1780 — Your plantation begins with debts owed to London merchant houses. The Revolutionary War closed Atlantic markets and prices have not recovered. Tobacco fetches barely 4¢ a pound. Keep your expenses lean.",
  "year-1781":
    "Spring 1781 — The war drags on in the South. British naval patrols still disrupt Atlantic shipping. Your tobacco sits in riverside warehouses, waiting for ships that may not come.",
  "year-1782":
    "Spring 1782 — Peace negotiations are underway in Paris. Your merchant contacts are cautious but hopeful. If Britain opens its ports again, tobacco prices could recover before the decade ends.",
  "year-1783":
    "Spring 1783 — The Treaty of Paris is signed. British markets will reopen — slowly. Your factor writes from London that prices should begin to recover. Hold your inventory if you can afford to.",
  "year-1784":
    "Spring 1784 — Atlantic trade is stirring back to life. Scottish tobacco merchants have returned to the Chesapeake. Prices are edging upward. The worst years may be behind you.",
  "year-1785":
    "Spring 1785 — Soil exhaustion is now a topic in every courthouse and tavern. Washington at Mount Vernon has turned largely to wheat. You are still growing tobacco.",
  "year-1786":
    "Spring 1786 — A financial depression grips the new republic. Debtors in Massachusetts are in open revolt — Shays' Rebellion. Creditor pressure is everywhere. Your mortgage is no different.",
  "year-1787":
    "Spring 1787 — The Constitutional Convention meets in Philadelphia this summer. The document being written there will protect the institution your plantation depends on for another seventy years.",
  "year-1788":
    "Spring 1788 — Virginia ratifies the new Constitution after heated debate. Patrick Henry feared federal power would eventually threaten slavery. He was right, though it would take seventy years to prove him so.",
  "year-1789":
    "Spring 1789 — George Washington takes office as the first President. He is a fellow Virginia tobacco planter, and his plantation at Mount Vernon faces the same soil exhaustion and debt pressure you do.",
  "year-1790":
    "Spring 1790 — Congress passes the first Fugitive Slave Act, requiring the return of escaped enslaved people across state lines. The entire weight of the republic now stands behind the institution your plantation depends upon.",
  "year-1791":
    "Spring 1791 — An uprising of enslaved people in the French colony of Saint-Domingue has entered its third month. Planters in Virginia read the dispatches with dread. It will produce the first Black republic in the Americas.",
  "year-1792":
    "Spring 1792 — A Yale graduate named Eli Whitney has arrived in Georgia as a tutor. He has heard of the difficulties separating cotton fiber from seed, and is said to be investigating a mechanical solution.",
};

// ── Event header summaries ──────────────────────────────────────────────────
// Short 1-line text shown in the header subtitle when a random event fires.
// The full historical note still goes to the event log.
export const EVENT_HEADER_TEXT: Record<string, string> = {
  "tobacco-blight": "EVENT — A tobacco blight has spread through the rows this summer. Tending gains are partially undone.",
  "drought":        "EVENT — Weeks of punishing heat cracked the soil and stressed the plants. Soil condition has worsened.",
  "early-frost":    "EVENT — An early frost arrived before the crop could fully ripen. A portion of the harvest is ruined.",
  "price-crash":    "EVENT — Dispatches from the merchant houses: tobacco prices have collapsed. Prices will recover, but not this season.",
  "good-harvest":   "EVENT — Mild rains and temperate weather blessed the tobacco this summer. Yield is ahead of expectations.",
};

// ── Rotating flavor pool ────────────────────────────────────────────────────
// Shown in the header subtitle once all first-occurrence milestones have fired.
// Rotates by (year * 4 + seasonIndex) so it changes every season but is deterministic.
export const FLAVOR_POOL: string[] = [
  "Tobacco was currency in colonial Virginia — rents, fees, and debts were all denominated in pounds of leaf.",
  "A hogshead of tobacco weighed 500–1,000 lbs and was rolled by enslaved workers miles to river landing docks along specially built 'rolling roads.'",
  "George Washington grew tobacco at Mount Vernon until 1766, then switched to wheat. He called tobacco 'an irksome and unprofitable crop' that left his fields 'much worn and exhausted.'",
  "Virginia planters rarely sold their crop directly — they shipped on consignment to British merchant houses in London and Glasgow, who sold it and credited the proceeds against ever-growing lines of credit.",
  "The tobacco worm — Manduca sexta — was the planter's constant enemy. Enslaved workers were set to pick the large green caterpillars from plants by hand, one by one, row by row.",
  "Tobacco depletes nitrogen from the soil faster than almost any other crop. Chesapeake planters had no scientific explanation — they called worn-out land 'tired' and moved on.",
  "The standard Chesapeake tobacco cycle: plant seedbeds in Winter, transplant in Spring, top the flower bud in Summer to push energy to the leaves, harvest in Fall, cure over Winter.",
  "Fire-curing involved hanging leaf in a barn and burning hardwood on the floor below for weeks. The resulting tobacco was dense and rich, prized for chewing and snuff.",
  "Gang labor — driving groups of workers in unison under close supervision — produced roughly 39% more output than individual task assignment, according to economists who study the period.",
  "Planters hired out surplus enslaved workers to neighbors, blacksmiths, millers, and ferry operators. The wages went entirely to the planter. The workers received nothing.",
  "The Chesapeake was shaped by rivers. Tobacco could only be grown profitably close to water — the James, York, Rappahannock, and Potomac — because rolling hogsheads to distant ports was prohibitively expensive.",
  "Thomas Jefferson kept meticulous farm accounts at Monticello and knew tobacco was destroying his soil. He was over $100,000 in debt when he died — a debt his estate could never repay.",
  "The enslaved population of Virginia grew from 210,000 in 1780 to 490,000 by 1860. Most of that growth was through natural increase — and through the domestic slave trade moving people to new cotton territory.",
  "Tobacco cultivation required roughly 1,700 hours of labor per acre per year. A four-worker plantation of eight acres required approximately 13,600 hours of labor annually — almost all of it compelled.",
  "An enslaved worker assigned as a 'driver' set the pace for gang labor, under pressure from the overseer above and resentment from fellow workers below. The role offered small privileges at a steep moral cost.",
  "The 'task system' — common in rice cultivation and some tobacco regions — assigned individual daily quotas. Workers who finished early could tend small personal plots. Planters found it harder to drive output than gang labor.",
  "Tobacco planters were perpetually in debt to British merchants, pledging their next harvest before it was grown. The system was designed to keep planters dependent, and it worked for over a century.",
  "Resistance was constant and largely invisible. Feigned illness, broken tools, slowed work, and small deliberate errors were the daily texture of life on a plantation — invisible in the ledger but everywhere in the fields.",
  "By 1790, Virginia had more enslaved people than any other state. The tobacco economy that produced this had also produced the men who wrote the Declaration of Independence.",
  "The cotton gin would arrive in 1793 — but on the Chesapeake, tobacco remained the crop that defined everything: the soil, the debt, the labor, and the slow exhaustion of the land.",
];