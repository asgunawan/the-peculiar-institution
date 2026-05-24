import {
  TASKS,
  CURING_CAPACITY_PER_WORKER,
  CURING_RATIO,
  HIREOUT_INCOME_PER_WORKER,
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
  Spring: "Hire Out / Field Prep",
  Summer: "Hire Out / Worming & Topping",
  Fall:   "Hire Out / Stalk Clearing",
  Winter: "Off-Season Fieldwork (soil)",
};

const SEASONAL_MAINTENANCE_HINTS = {
  Spring: "Workers hill rows and hoe weeds. Surplus workers are hired out to neighboring farms.",
  Summer: "Workers patrol for hornworms and top flower heads. Surplus workers are hired out to neighboring farms.",
  Fall:   "Workers clear stalks and break soil. Surplus workers are hired out to neighboring farms.",
  Winter: "Workers burn seedbeds and repair fences. Off-season field work partially restores soil health.",
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
    const flavorHint = SEASONAL_MAINTENANCE_HINTS[season] ?? "General plantation work.";
    if (season === "Winter") {
      // Winter: soil restoration
      const total = count * SOIL_RESTORE_PER_WORKER;
      if (count === 0) {
        return `${flavorHint} Each worker restores ${SOIL_RESTORE_PER_WORKER} soil health (spread across all plots).`;
      }
      const perPlot = numPlots > 0 ? Math.round(total / numPlots) : total;
      return `${flavorHint} ${count} worker${count !== 1 ? "s" : ""} -> +${perPlot} soil per plot.`;
    }
    // Growing seasons: hire-out income
    if (count === 0) {
      return `${flavorHint} Surplus workers can be hired out to neighboring farms at $${HIREOUT_INCOME_PER_WORKER}/worker/season.`;
    }
    const totalIncome = count * HIREOUT_INCOME_PER_WORKER;
    return `${flavorHint} ${count} worker${count !== 1 ? "s" : ""} hired out — $${totalIncome} earned this season.`;
  }

  if (task === TASKS.PLANTING) {
    const fallowCount = plots.filter(p => p.state === "fallow").length;
    if (fallowCount === 0) return "No fallow land to plant — all plots already carry crops.";
    const willPlant = Math.min(count, fallowCount);
    if (count === 0) return `${fallowCount} fallow plot${fallowCount !== 1 ? "s" : ""} available. Assign 1 worker per plot to plant.`;
    const extra = count - willPlant;
    const result = `${willPlant}/${fallowCount} fallow plots will be planted.`;
    return extra > 0 ? `${result} ${extra} worker${extra !== 1 ? "s are" : " is"} surplus (more workers than fallow land).` : result;
  }

  if (task === TASKS.HARVESTING) {
    const readyCount = plots.filter(p => p.state === "tended" || p.state === "planted").length;
    if (readyCount === 0) return "No plots are ready to harvest yet.";
    const willHarvest = Math.min(count, readyCount);
    if (count === 0) return `${readyCount} plot${readyCount !== 1 ? "s are" : " is"} ready to harvest. Assign 1 worker per plot.`;
    const missed = readyCount - willHarvest;
    const result = `${willHarvest}/${readyCount} plots will be harvested.`;
    return missed > 0 ? `${result} ${missed} plot${missed !== 1 ? "s will be" : " will be"} left unharvested — assign more workers.` : result;
  }

  return "";
}
