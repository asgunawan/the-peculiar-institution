// MarketPanel.jsx — Buy/sell interface: sell cured tobacco, buy workers, buy land.
import { WORKER_COST, PLOT_COST } from "../gameLogic/constants.js";

export default function MarketPanel({
  money,
  curedTobacco,
  currentPrice,
  onSellTen,
  onSellAll,
  onBuyWorker,
  onBuyPlot,
}) {
  const saleValue = ((curedTobacco * currentPrice) / 100).toFixed(2);
  const tenLbAmount = Math.min(10, curedTobacco);
  const tenLbValue = ((tenLbAmount * currentPrice) / 100).toFixed(2);

  return (
    <section className="panel market-panel">
      <h2>Market</h2>

      <div className="market-row">
        <div>
          <p className="market-item">Tobacco &mdash; {currentPrice}¢ / lb</p>
          <p className="market-sub">
            {curedTobacco} lbs available ≈ ${saleValue}
          </p>
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
          <button
            className="btn btn-sell"
            onClick={onSellAll}
            disabled={curedTobacco === 0}
          >
            Sell All
          </button>
        </div>
      </div>

      <hr className="market-divider" />

      <div className="market-row">
        <div>
          <p className="market-item">Buy a Worker</p>
          <p className="market-sub">${WORKER_COST} each</p>
        </div>
        <button
          className="btn btn-buy"
          onClick={onBuyWorker}
          disabled={money < WORKER_COST}
        >
          Buy (${WORKER_COST})
        </button>
      </div>

      <div className="market-row">
        <div>
          <p className="market-item">Buy a Plot of Land</p>
          <p className="market-sub">${PLOT_COST} each</p>
        </div>
        <button
          className="btn btn-buy"
          onClick={onBuyPlot}
          disabled={money < PLOT_COST}
        >
          Buy (${PLOT_COST})
        </button>
      </div>
    </section>
  );
}
