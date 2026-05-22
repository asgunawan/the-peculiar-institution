import {
  TASKS,
  CURING_CAPACITY_PER_WORKER,
  CURING_RATIO,
  SOIL_RESTORE_PER_WORKER,
  WORKERS_PER_PLOT_FULL_TEND,
} from "./constants.js";

const TASK_LABELS = {
  [TASKS.PLANTING]: "Planting",
  [TASKS.TENDING]: "Tending / Weeding",
  [TASKS.HARVESTING]: "Harvesting",
  [TASKS.CURING]: "Curing (raw -> cured leaf)",
};

const SEASONAL_MAINTENANCE_LABELS = {
  Spring: "Field Prep (hilling & harrowing)",
  Summer: "Worming & Topping",
  Fall: "Stalk Clearing & Soil Break",
  Winter: "Plant Bed Burning",
};

const SEASONAL_MAINTENANCE_HINTS = {
  Spring: "Workers hill rows and hoe weeds around new transplants.",
  Summer:
    "Workers patrol every plant for hornworms; pinch off flower heads (topping) to improve leaf quality.",
  Fall: "Workers clear cut stalks and break soil to reduce next season's pest load.",
  Winter: "Workers burn cleared woodland to sterilize seedbeds and repair fences for spring.",
};

export function getTaskLabel(task, season) {
  if (task === TASKS.MAINTENANCE) {
    return SEASONAL_MAINTENANCE_LABELS[season] ?? "Field Maintenance";
  }
  return TASK_LABELS[task] ?? task;
}

export function getTendingEfficiency(count, plots) {
  const fullNeeded = plots.length * WORKERS_PER_PLOT_FULL_TEND;
  if (fullNeeded <= 0) return 0;
  return Math.round(Math.min(count / fullNeeded, 1) * 100);
}

export function getYieldClass(efficiencyPercent) {
  if (efficiencyPercent >= 95) return "yield-high";
  if (efficiencyPercent >= 50) return "yield-mid";
  return "yield-low";
}

export function getTaskHint(task, count, plots, season) {
  const numPlots = plots.length;

  if (task === TASKS.TENDING) {
    const fullNeeded = numPlots * WORKERS_PER_PLOT_FULL_TEND;
    const fullNeededCeil = Math.ceil(fullNeeded);
    if (count === 0) {
      return `Need ${fullNeededCeil} workers for full yield on ${numPlots} plot${numPlots !== 1 ? "s" : ""}. Under-staffed fields yield as low as 30%.`;
    }
    const eff = getTendingEfficiency(count, plots);
    return `${count}/${fullNeededCeil} workers -> ~${eff}% yield this Fall.`;
  }

  if (task === TASKS.CURING) {
    const rawCap = count * CURING_CAPACITY_PER_WORKER;
    const curedOut = Math.floor(rawCap / CURING_RATIO);
    if (count === 0) {
      const perWorkerCured = Math.floor(CURING_CAPACITY_PER_WORKER / CURING_RATIO);
      return `Each worker cures ${CURING_CAPACITY_PER_WORKER.toLocaleString()} lbs raw -> ${perWorkerCured.toLocaleString()} lbs cured. Uncured leaf rots.`;
    }
    return `${count} worker${count !== 1 ? "s" : ""} -> up to ${rawCap.toLocaleString()} lbs raw -> ${curedOut.toLocaleString()} lbs cured. Uncured leaf rots.`;
  }

  if (task === TASKS.MAINTENANCE) {
    const flavorHint = SEASONAL_MAINTENANCE_HINTS[season] ?? "Soil restoration work.";
    const total = count * SOIL_RESTORE_PER_WORKER;
    if (count === 0) {
      return `${flavorHint} Each worker restores ${SOIL_RESTORE_PER_WORKER} soil health.`;
    }
    const perPlot = numPlots > 0 ? Math.round(total / numPlots) : total;
    return `${flavorHint} ${count} worker${count !== 1 ? "s" : ""} -> +${perPlot} soil per plot.`;
  }

  const staticHints = {
    [TASKS.PLANTING]: "1 worker plants 1 plot.",
    [TASKS.HARVESTING]: "1 worker harvests 1 plot.",
  };
  return staticHints[task] ?? "";
}
