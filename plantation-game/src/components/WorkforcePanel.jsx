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

  function handleChange(task, value) {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    const otherSum = activeTasks
      .filter((t) => t !== task)
      .reduce((sum, t) => sum + (assignments[t] || 0), 0);
    const clamped = Math.min(parsed, workers - otherSum);
    onChange({ ...assignments, [task]: clamped });
  }

  return (
    <section className="panel workforce-panel">
      <h2>Workforce</h2>
      <p className="panel-meta">
        {workers} workers total &mdash;{" "}
        <span className={remaining < 0 ? "over-assigned" : "workers-remaining"}>
          {remaining} unassigned
        </span>
      </p>

      {activeTasks.map((task) => (
        <div className="task-row" key={task}>
          <label htmlFor={`task-${task}`} className="task-label">
            {TASK_LABELS[task]}
            <span className="task-hint">{TASK_HINTS[task]}</span>
          </label>
          <input
            id={`task-${task}`}
            type="number"
            min={0}
            max={workers}
            value={assignments[task] || 0}
            onChange={(e) => handleChange(task, e.target.value)}
          />
        </div>
      ))}

      {remaining < 0 && (
        <p className="error-msg">Over-assigned by {Math.abs(remaining)} worker(s). Reduce assignments.</p>
      )}
    </section>
  );
}
