import type { Resources } from "../gameLogic/types";

interface ResourcePanelProps {
  resources: Resources;
}

export default function ResourcePanel({ resources }: ResourcePanelProps) {
  const { rawTobacco, curedTobacco } = resources;
  return (
    <section className="panel resource-panel">
      <h2>Stockroom</h2>
      <div className="resource-row">
        <span className="resource-name">Raw Tobacco Leaf</span>
        <span className="resource-value">{rawTobacco} lbs</span>
      </div>
      <div className="resource-row">
        <span className="resource-name">Cured Tobacco</span>
        <span className="resource-value highlight">{curedTobacco} lbs</span>
      </div>
      {rawTobacco > 0 && (
        <p className="resource-hint">Raw leaf must be cured in Winter before it can be sold. Uncured leaf rots.</p>
      )}
    </section>
  );
}