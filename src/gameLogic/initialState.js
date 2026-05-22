// initialState.js
// Returns a fresh gameState object. Called once on app load and on "New Game".
// Import this instead of hard-coding state shape anywhere else.

import {
  SEASONS,
  STARTING_MONEY,
  STARTING_WORKERS,
  STARTING_PLOTS,
  START_YEAR,
} from "./constants.js";

/**
 * Generates the array of starting plots.
 * Each plot tracks its own soil health and crop state independently.
 */
function buildStartingPlots(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: i === 0 ? "Home Field" : `Plot ${i + 1}`,
    soilHealth: 100,   // 0–100; degrades each harvest, restored by maintenance
    cropType: "tobacco",
    // state: "fallow" | "planted" | "tended" | "harvestable"
    state: "fallow",
    yieldModifier: 1.0, // set during Summer tending, consumed during Fall harvest
  }));
}

export function createInitialState() {
  return {
    year: START_YEAR,
    seasonIndex: 0,          // index into SEASONS array
    get season() { return SEASONS[this.seasonIndex]; },

    money: STARTING_MONEY,
    workers: STARTING_WORKERS,

    plots: buildStartingPlots(STARTING_PLOTS),

    resources: {
      rawTobacco: 0,   // lbs harvested, awaiting curing
      curedTobacco: 0, // lbs ready to sell
    },

    // Worker assignment for the current season.
    // UI populates these; seasonEngine reads them.
    assignments: {
      planting: 0,
      tending: 0,
      harvesting: 0,
      curing: 0,
      maintenance: 0,
    },

    log: [], // Array<{id:number,text:string}> newest first, max 20
    logCounter: 1, // next unique integer ID for log entries

    // Consecutive seasons with negative cash. Used by foreclosure logic.
    debtSeasons: 0,

    // Player's explicit maintenance preference, persisted across season transitions.
    // Prevents Winter's all-curing allocation from zeroing out Spring maintenance.
    maintenanceTarget: 0,

    gameOver: false,
    victory: false,
  };
}
