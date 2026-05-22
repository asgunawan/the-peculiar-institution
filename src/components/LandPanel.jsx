// LandPanel.jsx — Shows each plot's soil health as a colored bar.
import { SOIL_THRESHOLDS } from "../gameLogic/constants.js";

function soilColor(health) {
  if (health > SOIL_THRESHOLDS.GOOD) return "soil-good";
  if (health > SOIL_THRESHOLDS.WARN) return "soil-warn";
  return "soil-poor";
}

const STATE_LABELS = {
  fallow:     "Fallow",
  planted:    "Planted",
  tended:     "Tended",
  harvestable: "Ready",
};

export default function LandPanel({ plots, maintenanceSoilGain = 0 }) {
  return (
    <section className="panel land-panel">
      <h2>Land ({plots.length} plot{plots.length !== 1 ? "s" : ""})</h2>
      {plots.map((plot) => {
        const roundedSoil = Math.round(plot.soilHealth);
        const previewGain = Math.max(0, Math.min(maintenanceSoilGain, 100 - roundedSoil));
        const projectedSoil = Math.min(100, roundedSoil + previewGain);

        return (
          <div className="plot-row" key={plot.id}>
            <span className="plot-name">{plot.name ?? `Plot ${plot.id}`}</span>
            <span className="plot-state">{STATE_LABELS[plot.state] ?? plot.state}</span>
            <div className="soil-bar-track">
              <div
                className={`soil-bar-fill ${soilColor(plot.soilHealth)}`}
                style={{ width: `${plot.soilHealth}%` }}
              />
              {previewGain > 0 && (
                <div className="soil-bar-preview" style={{ width: `${previewGain}%` }} />
              )}
            </div>
            <span className="soil-pct">
              {roundedSoil}%{previewGain > 0 ? ` -> ${projectedSoil}%` : ""}
            </span>
          </div>
        );
      })}
    </section>
  );
}
