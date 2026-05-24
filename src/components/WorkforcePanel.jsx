// WorkforcePanel.jsx
// Lets the player assign workers to season-relevant tasks.
// Only tasks valid for the current season are shown.
// Validates that the sum of assignments never exceeds total workers.

import {
  SEASON_TASKS,
  TASKS,
  WORKERS_PER_PLOT_FULL_TEND,
} from "../gameLogic/constants.js";
import {
  getTaskHint,
  getTaskLabel,
  getTendingEfficiency,
  getYieldClass,
} from "../gameLogic/taskHints.js";

export default function WorkforcePanel({ workers, enslavedCount, freeCount, season, assignments, plots, onChange }) {
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
        {enslavedCount > 0 && <span>{enslavedCount} enslaved</span>}
        {enslavedCount > 0 && freeCount > 0 && <span className="meta-sep"> / </span>}
        {freeCount > 0 && <span>{freeCount} hired</span>}
        {" "}&mdash;{" "}
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
