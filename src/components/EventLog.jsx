// EventLog.jsx — Text feed of the last N season events, newest at top.
export default function EventLog({ log }) {
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
          <li key={i} className={`log-entry ${i === 0 ? "log-entry-latest" : ""}`}>
            {entry}
          </li>
        ))}
      </ol>
    </section>
  );
}
