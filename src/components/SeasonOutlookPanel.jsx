export default function SeasonOutlookPanel({
  nextSeason,
  nextYear,
  debtRisk,
  curingOutlook,
  harvestOutlook,
}) {
  const curingRiskClass =
    curingOutlook.shortfall === null
      ? "risk-low"
      : curingOutlook.shortfall > 0
        ? "risk-high"
        : "risk-low";

  const curingSummary =
    curingOutlook.shortfall === null
      ? "Not available yet"
      : curingOutlook.shortfall > 0
        ? `${curingOutlook.shortfall.toLocaleString()} lbs at risk`
        : "0 lbs at risk";

  return (
    <section className="panel outlook-panel">
      <h2>Season Outlook</h2>
      <p className="outlook-meta">If you advance now: {nextSeason} {nextYear}</p>

      <div className="outlook-block">
        <p className="outlook-label">Debt Risk (Next Advance)</p>
        <p className={`outlook-value risk-${debtRisk.level}`}>{debtRisk.title}</p>
        <p className="outlook-hint">{debtRisk.detail}</p>
      </div>

      <div className="outlook-block">
        <p className="outlook-label">Winter Curing Shortfall ({curingOutlook.timing})</p>
        <p className={`outlook-value ${curingRiskClass}`}>{curingSummary}</p>
        <p className="outlook-hint">{curingOutlook.detail}</p>
      </div>

      {harvestOutlook && (
        <div className="outlook-block">
          <p className="outlook-label">{harvestOutlook.label}</p>
          <p className="outlook-value risk-low">{harvestOutlook.value}</p>
          <p className="outlook-hint">{harvestOutlook.detail}</p>
        </div>
      )}
    </section>
  );
}
