import { FALLOW_RECOVERY_CAP, FALLOW_RECOVERY_PER_SEASON, SOIL_THRESHOLDS } from "../gameLogic/constants";
import type { Plot } from "../gameLogic/types";

interface LandPanelProps {
  plots: Plot[];
  maintenanceSoilGain?: number;
  onTogglePlotRest?: (plotId: number) => void;
  onConvertToProvision?: (plotId: number) => void;
}

function soilColor(health: number): string {
  if (health > SOIL_THRESHOLDS.GOOD) return "soil-good";
  if (health > SOIL_THRESHOLDS.WARN) return "soil-warn";
  return "soil-poor";
}

function plotStateLabel(plot: Plot): string {
  if (plot.cropType === "provision") return "Provision";
  if (plot.state === "fallow" && plot.resting) return "Resting";
  const labels: Record<string, string> = { fallow: "Fallow", planted: "Planted", tended: "Tended", harvestable: "Ready" };
  return labels[plot.state] ?? plot.state;
}

export default function LandPanel({ plots, maintenanceSoilGain = 0, onTogglePlotRest, onConvertToProvision }: LandPanelProps) {
  const tobaccoPlotCount = plots.filter((p) => p.cropType === "tobacco").length;
  return (
    <section className="panel land-panel">
      <h2>
        Land ({plots.length} plot{plots.length !== 1 ? "s" : ""})
      </h2>
      {plots.map((plot) => {
        const isProvision = plot.cropType === "provision";

        if (isProvision) {
          return (
            <div className="plot-row plot-provision" key={plot.id}>
              <span className="plot-name">{plot.name ?? `Plot ${plot.id}`}</span>
              <span className="plot-state plot-state-provision">Provision</span>
              <div className="provision-grounds-bar">
                <span className="provision-grounds-label">Provision Grounds — $3/worker/season upkeep savings</span>
              </div>
              <span className="soil-pct soil-pct-provision">&nbsp;</span>
            </div>
          );
        }

        const roundedSoil = Math.round(plot.soilHealth);
        const previewGain = Math.max(0, Math.min(maintenanceSoilGain, 100 - roundedSoil));
        const projectedSoil = Math.min(100, roundedSoil + previewGain);
        const isFallow = plot.state === "fallow";
        const atOrAboveCap = isFallow && plot.soilHealth >= FALLOW_RECOVERY_CAP;
        const actualFallowGain = isFallow && !atOrAboveCap ? Math.min(FALLOW_RECOVERY_PER_SEASON, FALLOW_RECOVERY_CAP - plot.soilHealth) : 0;
        const willCapThisSeason = actualFallowGain > 0 && actualFallowGain < FALLOW_RECOVERY_PER_SEASON;
        const canConvert = isFallow && !plot.resting && onConvertToProvision && tobaccoPlotCount > 1;

        return (
          <div className={`plot-row${plot.resting ? " plot-resting" : ""}`} key={plot.id}>
            <span className="plot-name">{plot.name ?? `Plot ${plot.id}`}</span>
            <span className={`plot-state${plot.resting ? " plot-state-resting" : ""}`}>{plotStateLabel(plot)}</span>
            <div className="soil-bar-track">
              <div className={`soil-bar-fill ${soilColor(plot.soilHealth)}`} style={{ width: `${plot.soilHealth}%` }} />
              {previewGain > 0 && <div className="soil-bar-preview" style={{ width: `${previewGain}%` }} />}
              <div className="soil-cap-marker" style={{ left: `${FALLOW_RECOVERY_CAP}%` }} />
            </div>
            <span className="soil-pct">
              {roundedSoil}%{previewGain > 0 ? ` → ${projectedSoil}%` : ""}
              {atOrAboveCap && <span className="fallow-recovery-hint at-cap"> (recovery limit)</span>}
              {willCapThisSeason && (
                <span className="fallow-recovery-hint">
                  {' '}(+{Math.round(actualFallowGain)} → {FALLOW_RECOVERY_CAP}% cap)
                </span>
              )}
              {actualFallowGain >= FALLOW_RECOVERY_PER_SEASON && (
                <span className="fallow-recovery-hint"> (+{FALLOW_RECOVERY_PER_SEASON}/season)</span>
              )}
            </span>
            <div className="plot-actions">
              {isFallow && onTogglePlotRest && (
                <button
                  className={`btn-plot-rest ${plot.resting ? "btn-plot-rest--active" : ""}`}
                  onClick={() => onTogglePlotRest(plot.id)}
                  title={plot.resting ? "Return this plot to active rotation" : "Leave this plot fallow to recover soil"}
                >
                  {plot.resting ? "Return to Rotation" : "Set to Rest"}
                </button>
              )}
              {canConvert && (
                <button
                  className="btn-plot-provision"
                  onClick={() => onConvertToProvision(plot.id)}
                  title="Permanently dedicate to food production — reduces worker upkeep to $4/season"
                >
                  → Provision
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}