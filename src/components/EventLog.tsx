import { getLogEntryText } from "../gameLogic/logUtils.js";
import type { LogEntry } from "../gameLogic/types";

interface EventLogProps {
  log: Array<LogEntry | string>;
}

export default function EventLog({ log }: EventLogProps) {
  if (!log || log.length === 0) {
    return (
      <section className="panel log-panel">
        <h2>Chronicle</h2>
        <p className="log-empty">No events yet. Assign workers and advance the season.</p>
      </section>
    );
  }

  return (
    <section className="panel log-panel">
      <h2>Chronicle</h2>
      <ol className="log-list">
        {log.map((entry, i) => (
          <li
            key={entry && typeof entry === "object" && "id" in entry ? entry.id : `legacy-${i}-${String(entry)}`}
            className={`log-entry ${i === 0 ? "log-entry-latest" : ""}`}
          >
            {getLogEntryText(entry)}
          </li>
        ))}
      </ol>
    </section>
  );
}