// WorkforcePanel.jsx
// Lets the player assign workers to season-relevant tasks.
// Only tasks valid for the current season are shown.
// Validates that the sum of assignments never exceeds total workers.

import { SEASON_TASKS, TASKS } from "../gameLogic/constants.js";

const TASK_LABELS = {
  [TASKS.PLANTING]:    "Planting",
  [TASKS.TENDING]:     "Tending / Weeding",
  [TASKS.HARVESTING]:  "Harvesting",
  [TASKS.CURING]:      "Curing (raw → cured leaf)",
  [TASKS.MAINTENANCE]: "Field Maintenance (soil restore)",
};

const TASK_HINTS = {
  [TASKS.PLANTING]:    "1 worker plants 1 plot.",
  [TASKS.TENDING]:     "More workers = better yield modifier.",
  [TASKS.HARVESTING]:  "1 worker harvests 1 plot.",
  [TASKS.CURING]:      "Each worker cures 20 lbs of raw leaf (2 lbs raw → 1 lb cured). Uncured leaf rots.",
  [TASKS.MAINTENANCE]: `Each worker restores ${5} soil health, spread across all plots.`,
};

export default function WorkforcePanel({ workers, season, assignments, onChange }) {
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
        return (
          <div className="task-row" key={task}>
            <div className="task-label">
              {TASK_LABELS[task]}
              <span className="task-hint">{TASK_HINTS[task]}</span>
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
