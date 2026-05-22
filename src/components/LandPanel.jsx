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

export default function LandPanel({ plots }) {
  return (
    <section className="panel land-panel">
      <h2>Land ({plots.length} plot{plots.length !== 1 ? "s" : ""})</h2>
      {plots.map((plot) => (
        <div className="plot-row" key={plot.id}>
          <span className="plot-name">Plot {plot.id}</span>
          <span className="plot-state">{STATE_LABELS[plot.state] ?? plot.state}</span>
          <div className="soil-bar-track">
            <div
              className={`soil-bar-fill ${soilColor(plot.soilHealth)}`}
              style={{ width: `${plot.soilHealth}%` }}
            />
          </div>
          <span className="soil-pct">{Math.round(plot.soilHealth)}%</span>
        </div>
      ))}
    </section>
  );
}
