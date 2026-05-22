// App.jsx — Root component. Owns all game state and coordinates panels.
import { useState, useCallback } from "react";
import { createInitialState } from "./gameLogic/initialState.js";
import { resolveSeason, getSellPrice } from "./gameLogic/seasonEngine.js";
import { SEASONS, WORKER_COST, PLOT_COST } from "./gameLogic/constants.js";
import GameHeader from "./components/GameHeader.jsx";
import WorkforcePanel from "./components/WorkforcePanel.jsx";
import LandPanel from "./components/LandPanel.jsx";
import ResourcePanel from "./components/ResourcePanel.jsx";
import MarketPanel from "./components/MarketPanel.jsx";
import EventLog from "./components/EventLog.jsx";
import "./App.css";

export default function App() {
  const [state, setState] = useState(createInitialState);
  const [currentPrice, setCurrentPrice] = useState(() =>
    getSellPrice(createInitialState().year)
  );

  const handleAssignmentChange = useCallback((newAssignments) => {
    setState((s) => ({ ...s, assignments: newAssignments }));
  }, []);

  const handleAdvanceSeason = useCallback(() => {
    setState((s) => {
      const next = resolveSeason(s);
      setCurrentPrice(getSellPrice(next.year));
      return next;
    });
  }, []);

  const handleSellAll = useCallback(() => {
    setState((s) => {
      if (s.resources.curedTobacco === 0) return s;
      // price is cents/lb; convert to dollars
      const earnedDollars = parseFloat(
        ((s.resources.curedTobacco * currentPrice) / 100).toFixed(2)
      );
      return {
        ...s,
        money: parseFloat((s.money + earnedDollars).toFixed(2)),
        resources: { ...s.resources, curedTobacco: 0 },
        log: [
          `Sold ${s.resources.curedTobacco} lbs of tobacco at ${currentPrice}¢/lb for $${earnedDollars.toFixed(2)}.`,
          ...s.log,
        ].slice(0, 20),
      };
    });
    setCurrentPrice(getSellPrice(state.year));
  }, [currentPrice, state.year]);

  const handleBuyWorker = useCallback(() => {
    setState((s) => {
      if (s.money < WORKER_COST) return s;
      return {
        ...s,
        money: parseFloat((s.money - WORKER_COST).toFixed(2)),
        workers: s.workers + 1,
        log: [`Purchased one additional worker for $${WORKER_COST}.`, ...s.log].slice(0, 20),
      };
    });
  }, []);

  const handleBuyPlot = useCallback(() => {
    setState((s) => {
      if (s.money < PLOT_COST) return s;
      const newId = s.plots.length + 1;
      return {
        ...s,
        money: parseFloat((s.money - PLOT_COST).toFixed(2)),
        plots: [
          ...s.plots,
          { id: newId, soilHealth: 100, cropType: "tobacco", state: "fallow", yieldModifier: 1.0 },
        ],
        log: [`Acquired Plot ${newId} — virgin land, full soil health.`, ...s.log].slice(0, 20),
      };
    });
  }, []);

  const handleNewGame = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
    setCurrentPrice(getSellPrice(fresh.year));
  }, []);

  const season = SEASONS[state.seasonIndex];
  const totalAssigned = Object.values(state.assignments).reduce((a, b) => a + b, 0);
  const isOverAssigned = totalAssigned > state.workers;

  if (state.gameOver) {
    return (
      <div className="overlay-screen game-over">
        <h1>The Plantation is Lost</h1>
        <p>
          Your creditors have come. With no money and no tobacco to sell, the
          operation has collapsed.
        </p>
        <p className="overlay-year">Year {state.year}</p>
        <button className="btn btn-new-game" onClick={handleNewGame}>Try Again</button>
      </div>
    );
  }

  if (state.victory) {
    return (
      <div className="overlay-screen victory">
        <h1>A New Era Begins</h1>
        <p>
          It is 1793. A letter arrives from Connecticut. Eli Whitney has invented
          the cotton gin — a machine that separates cotton fiber from seed at fifty
          times the speed of hand-picking.
        </p>
        <p>The world is about to change. Your tobacco operation survives, but the future belongs to cotton.</p>
        <p className="overlay-year">Treasury: ${state.money.toFixed(0)}</p>
        <button className="btn btn-new-game" onClick={handleNewGame}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="app">
      <GameHeader year={state.year} season={season} money={state.money} />
      <main className="game-grid">
        <div className="col-left">
          <WorkforcePanel
            workers={state.workers}
            season={season}
            assignments={state.assignments}
            onChange={handleAssignmentChange}
          />
          <LandPanel plots={state.plots} />
        </div>
        <div className="col-right">
          <ResourcePanel resources={state.resources} />
          <MarketPanel
            money={state.money}
            curedTobacco={state.resources.curedTobacco}
            currentPrice={currentPrice}
            onSellAll={handleSellAll}
            onBuyWorker={handleBuyWorker}
            onBuyPlot={handleBuyPlot}
          />
          <EventLog log={state.log} />
        </div>
      </main>
      <footer className="game-footer">
        <button
          className="btn btn-advance"
          onClick={handleAdvanceSeason}
          disabled={isOverAssigned}
          title={isOverAssigned ? "Reduce worker assignments before advancing." : ""}
        >
          Advance to {SEASONS[(state.seasonIndex + 1) % SEASONS.length]}{" "}
          {state.seasonIndex === 3 ? state.year + 1 : state.year}
        </button>
        {isOverAssigned && (
          <p className="footer-warning">Over-assigned — reduce worker assignments first.</p>
        )}
      </footer>
    </div>
  );
}
