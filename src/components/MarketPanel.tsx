import {
  BASE_YIELD_PER_PLOT,
  ENSLAVED_PURCHASE_COST,
  FREE_WORKER_WAGE_PER_SEASON,
  PLOT_COST,
  BASE_HOUSING_CAPACITY,
  CABIN_HOUSING_CAPACITY,
  CABIN_COST,
  TOOL_SHED_COST,
  TOOL_SHED_YIELD_BONUS,
} from "../gameLogic/constants";
import type { Building, SeasonName } from "../gameLogic/types";

const PLOT_TIMING_HINT: Record<SeasonName, string> = {
  Spring: "Buy before advancing to plant it this season.",
  Summer: "Bought now, this plot won't be plantable until next Spring.",
  Fall: "Bought now, this plot won't be plantable until next Spring.",
  Winter: "Buy now to have it ready to plant next Spring.",
};

interface MarketPanelProps {
  money: number;
  season: SeasonName;
  curedTobacco: number;
  currentPrice: number;
  onSellTen: () => void;
  onSellAll: () => void;
  totalWorkers: number;
  enslavedCount: number;
  buildings: Building[];
  onBuyWorker: () => void;
  onHireFreeWorker: () => void;
  onDismissFreeWorker: () => void;
  freeCount: number;
  onBuyPlot: () => void;
  onBuildCabin: () => void;
  onBuyToolShed: () => void;
}

export default function MarketPanel({
  money,
  season,
  curedTobacco,
  currentPrice,
  onSellTen,
  onSellAll,
  totalWorkers,
  enslavedCount,
  buildings,
  onBuyWorker,
  onHireFreeWorker,
  onDismissFreeWorker,
  freeCount,
  onBuyPlot,
  onBuildCabin,
  onBuyToolShed,
}: MarketPanelProps) {
  const saleValue = ((curedTobacco * currentPrice) / 100).toFixed(2);
  const tenLbAmount = Math.min(10, curedTobacco);
  const tenLbValue = ((tenLbAmount * currentPrice) / 100).toFixed(2);

  const cabinCount = buildings.filter((b) => b.type === "quarter_cabin").length;
  const housingCapacity = BASE_HOUSING_CAPACITY + cabinCount * CABIN_HOUSING_CAPACITY;
  const housingFull = enslavedCount >= housingCapacity;
  const hasToolShed = buildings.some((b) => b.type === "tool_shed");

  return (
    <section className="panel market-panel">
      <h2>Market</h2>

      <div className="market-row">
        <div className="market-copy">
          <p className="market-item">Tobacco &mdash; {currentPrice}¢ / lb</p>
          <p className="market-sub">{curedTobacco} lbs available ≈ ${saleValue}</p>
        </div>
        <div className="market-actions">
          <button
            className="btn btn-sell"
            onClick={onSellTen}
            disabled={curedTobacco === 0}
            title={curedTobacco > 0 ? `Sell ${tenLbAmount} lbs for about $${tenLbValue}` : "No cured tobacco to sell"}
          >
            Sell 10 lbs
          </button>
          <button className="btn btn-sell" onClick={onSellAll} disabled={curedTobacco === 0}>
            Sell All
          </button>
        </div>
      </div>

      <hr className="market-divider" />

      <div className="market-row">
        <div className="market-copy">
          <p className="market-item">Purchase Enslaved Worker</p>
          <p className="market-sub">
            ${ENSLAVED_PURCHASE_COST} upfront &mdash; $7/season upkeep, permanent labor.
          </p>
          <p className="market-sub">
            Housing: {enslavedCount} / {housingCapacity}
            {housingFull && <span className="market-sub-warn"> — quarters full</span>}
          </p>
        </div>
        <button
          className="btn btn-buy"
          onClick={onBuyWorker}
          disabled={money < ENSLAVED_PURCHASE_COST || housingFull}
          title={housingFull ? "Build more cabin rows to house additional workers" : undefined}
        >
          Buy (${ENSLAVED_PURCHASE_COST})
        </button>
      </div>

      <div className="market-row">
        <div className="market-copy">
          <p className="market-item">Hire Free Worker</p>
          <p className="market-sub">${FREE_WORKER_WAGE_PER_SEASON} paid now - works this season only, then returns home.</p>
        </div>
        <div className="market-actions">
          <button
            className="btn btn-buy"
            onClick={onHireFreeWorker}
            disabled={money < FREE_WORKER_WAGE_PER_SEASON}
            title={
              money < FREE_WORKER_WAGE_PER_SEASON
                ? `Need $${FREE_WORKER_WAGE_PER_SEASON} to hire a free worker`
                : "Hire one free seasonal worker"
            }
          >
            Hire (Free)
          </button>
          <button
            className="btn btn-sell"
            onClick={onDismissFreeWorker}
            disabled={freeCount === 0}
            title={freeCount === 0 ? "No free workers to release" : "Release one free worker"}
          >
            Release
          </button>
        </div>
      </div>

      <div className="market-row">
        <div className="market-copy">
          <p className="market-item">Buy a Plot of Land</p>
          <p className="market-sub">${PLOT_COST} each &mdash; {PLOT_TIMING_HINT[season]}</p>
          <p className="market-sub">
            Fresh plot yields ~{BASE_YIELD_PER_PLOT.toLocaleString()} lbs/yr at 100% soil; ~
            {(BASE_YIELD_PER_PLOT / 2).toLocaleString()} lbs at 50% soil.
          </p>
        </div>
        <button className="btn btn-buy" onClick={onBuyPlot} disabled={money < PLOT_COST}>
          Buy (${PLOT_COST})
        </button>
      </div>

      <hr className="market-divider" />

      <h3 className="market-section-heading">Infrastructure</h3>

      <div className="market-row">
        <div className="market-copy">
          <p className="market-item">Quarter Cabin Row</p>
          <p className="market-sub">
            +{CABIN_HOUSING_CAPACITY} worker housing capacity. Built from plantation timber.
          </p>
          {cabinCount > 0 && (
            <p className="market-sub market-sub-owned">
              {cabinCount} built &mdash; capacity {housingCapacity} (base {BASE_HOUSING_CAPACITY} + {cabinCount * CABIN_HOUSING_CAPACITY})
            </p>
          )}
        </div>
        <button className="btn btn-buy" onClick={onBuildCabin} disabled={money < CABIN_COST}>
          Build (${CABIN_COST})
        </button>
      </div>

      <div className="market-row">
        <div className="market-copy">
          <p className="market-item">Tool Cache</p>
          <p className="market-sub">
            +{Math.round(TOOL_SHED_YIELD_BONUS * 100)}% harvest yield. Iron hoes from a passing trader.
          </p>
          {hasToolShed && <p className="market-sub market-sub-owned">Owned &mdash; active this season</p>}
        </div>
        <button
          className="btn btn-buy"
          onClick={onBuyToolShed}
          disabled={money < TOOL_SHED_COST || hasToolShed}
          title={hasToolShed ? "Already purchased" : undefined}
        >
          {hasToolShed ? "Owned ✓" : `Buy ($${TOOL_SHED_COST})`}
        </button>
      </div>
    </section>
  );
}