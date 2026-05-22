// WorkforcePanel.jsx
// Lets the player assign workers to season-relevant tasks.
// Only tasks valid for the current season are shown.
// Validates that the sum of assignments never exceeds total workers.

import {
  SEASON_TASKS,
  TASKS,
  CURING_CAPACITY_PER_WORKER,
  CURING_RATIO,
  SOIL_RESTORE_PER_WORKER,
  WORKERS_PER_PLOT_FULL_TEND,
} from "../gameLogic/constants.js";

const TASK_LABELS = {
  [TASKS.PLANTING]:   "Planting",
  [TASKS.TENDING]:    "Tending / Weeding",
  [TASKS.HARVESTING]: "Harvesting",
  [TASKS.CURING]:     "Curing (raw → cured leaf)",
};

// Field maintenance tasks differed by season on tobacco plantations.
const SEASONAL_MAINTENANCE_LABELS = {
  Spring: "Field Prep (hilling & harrowing)",
  Summer: "Worming & Topping",
  Fall:   "Stalk Clearing & Soil Break",
  Winter: "Plant Bed Burning",
};

const SEASONAL_MAINTENANCE_HINTS = {
  Spring: "Workers hill rows and hoe weeds around new transplants.",
  Summer: "Workers patrol every plant for hornworms; pinch off flower heads (topping) to improve leaf quality.",
  Fall:   "Workers clear cut stalks and break soil to reduce next season\u2019s pest load.",
  Winter: "Workers burn cleared woodland to sterilize seedbeds and repair fences for spring.",
};

function getTaskLabel(task, season) {
  if (task === TASKS.MAINTENANCE) return SEASONAL_MAINTENANCE_LABELS[season] ?? "Field Maintenance";
  return TASK_LABELS[task] ?? task;
}

function getTaskHint(task, count, plots, season) {
  const numPlots = plots.length;
  if (task === TASKS.TENDING) {
    const fullNeeded = numPlots * WORKERS_PER_PLOT_FULL_TEND;
    const fullNeededCeil = Math.ceil(fullNeeded);
    if (count === 0) {
      return `Need ${fullNeededCeil} workers for full yield on ${numPlots} plot${numPlots !== 1 ? "s" : ""}. Under-staffed fields yield as low as 30%.`;
    }
    const eff = Math.round(Math.min(count / fullNeeded, 1) * 100);
    return `${count}/${fullNeededCeil} workers \u2192 ~${eff}% yield this Fall.`;
  }
  if (task === TASKS.CURING) {
    const rawCap = count * CURING_CAPACITY_PER_WORKER;
    const curedOut = Math.floor(rawCap / CURING_RATIO);
    if (count === 0) {
      const perWorkerCured = Math.floor(CURING_CAPACITY_PER_WORKER / CURING_RATIO);
      return `Each worker cures ${CURING_CAPACITY_PER_WORKER.toLocaleString()} lbs raw \u2192 ${perWorkerCured.toLocaleString()} lbs cured. Uncured leaf rots.`;
    }
    return `${count} worker${count !== 1 ? "s" : ""} \u2192 up to ${rawCap.toLocaleString()} lbs raw \u2192 ${curedOut.toLocaleString()} lbs cured. Uncured leaf rots.`;
  }
  if (task === TASKS.MAINTENANCE) {
    const flavorHint = SEASONAL_MAINTENANCE_HINTS[season] ?? "Soil restoration work.";
    const total = count * SOIL_RESTORE_PER_WORKER;
    if (count === 0) {
      return `${flavorHint} Each worker restores ${SOIL_RESTORE_PER_WORKER} soil health.`;
    }
    const perPlot = numPlots > 0 ? Math.round(total / numPlots) : total;
    return `${flavorHint} ${count} worker${count !== 1 ? "s" : ""} \u2192 +${perPlot} soil per plot.`;
  }
  const STATIC_HINTS = {
    [TASKS.PLANTING]:   "1 worker plants 1 plot.",
    [TASKS.HARVESTING]: "1 worker harvests 1 plot.",
  };
  return STATIC_HINTS[task] ?? "";
}

function getYieldClass(efficiencyPercent) {
  if (efficiencyPercent >= 95) return "yield-high";
  if (efficiencyPercent >= 50) return "yield-mid";
  return "yield-low";
}

function getTendingEfficiency(count, plots) {
  const fullNeeded = plots.length * WORKERS_PER_PLOT_FULL_TEND;
  if (fullNeeded <= 0) return 0;
  return Math.round(Math.min(count / fullNeeded, 1) * 100);
}

export default function WorkforcePanel({ workers, season, assignments, plots, onChange }) {
  const activeTasks = SEASON_TASKS[season] ?? [];
  const totalAssigned = activeTasks.reduce((sum, t) => sum + (assignments[t] || 0), 0);
  const remaining = workers - totalAssigned;

  function getMaxForTask(task) {
    const otherSum = activeTasks
      .filter((t) => t !== task)
      .reduce((sum, t) => sum + (assignments[t] || 0), 0);
    return Math.max(0, workers - otherSum);
  }

  function setTask(task, value) {
    const clamped = Math.max(0, Math.min(getMaxForTask(task), value));
    onChange({ ...assignments, [task]: clamped });
  }

  return (
    <section className="panel workforce-panel">
      <h2>Workforce</h2>
      <p className="panel-meta">
        {workers} workers total &mdash;{" "}
        <span className={remaining < 0 ? "over-assigned" : "workers-remaining"}>
          {remaining >= 0 ? `${remaining} unassigned` : `${Math.abs(remaining)} over limit`}
        </span>
      </p>

      {activeTasks.map((task) => {
        const current = assignments[task] || 0;
        const maxForTask = getMaxForTask(task);
        const isTendingWithAllocation = task === TASKS.TENDING && current > 0;
        const tendingEfficiency = isTendingWithAllocation
          ? getTendingEfficiency(current, plots)
          : 0;
        return (
          <div className="task-row" key={task}>
            <div className="task-label">
              {getTaskLabel(task, season)}
              <span className="task-hint">
                {isTendingWithAllocation ? (
                  <>
                    {`${current}/${Math.ceil(plots.length * WORKERS_PER_PLOT_FULL_TEND)} workers \u2192 ~`}
                    <span className={getYieldClass(tendingEfficiency)}>{tendingEfficiency}%</span>
                    {" yield this Fall."}
                  </>
                ) : (
                  getTaskHint(task, assignments[task] || 0, plots, season)
                )}
              </span>
            </div>
            <div className="task-controls">
              <button
                type="button"
                className="btn-step btn-step-clear"
                onClick={() => setTask(task, 0)}
                disabled={current === 0}
                title="Unassign all from this task"
              >
                ✕
              </button>
              <button
                type="button"
                className="btn-step"
                onClick={() => setTask(task, current - 1)}
                disabled={current <= 0}
              >
                −
              </button>
              <span className="task-count">{current}</span>
              <button
                type="button"
                className="btn-step"
                onClick={() => setTask(task, current + 1)}
                disabled={current >= maxForTask}
              >
                +
              </button>
              <button
                type="button"
                className="btn-inline-assign-all"
                onClick={() => setTask(task, workers)}
                disabled={current >= maxForTask}
                title={`Assign all ${maxForTask} remaining workers here`}
              >
                All
              </button>
            </div>
          </div>
        );
      })}

      {remaining < 0 && (
        <p className="error-msg">Over-assigned by {Math.abs(remaining)} worker(s). Reduce assignments.</p>
      )}
    </section>
  );
}
