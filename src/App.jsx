// App.jsx — Root coordinator for game panels and high-level flow.
import { useEffect, useState } from "react";
import {
  BASE_YIELD_PER_PLOT,
  CURING_CAPACITY_PER_WORKER,
  CURING_RATIO,
  SEASONS,
  ENSLAVED_UPKEEP_PER_SEASON,
  SEASON_TASKS,
  SOIL_RESTORE_PER_WORKER,
} from "./gameLogic/constants.js";
import { resolveSeason } from "./gameLogic/seasonEngine.js";
import { downloadLog, getLog } from "./gameLogic/runLogger.js";
import { useGameSession } from "./hooks/useGameSession.js";
import { useToastNotifications } from "./hooks/useToastNotifications.js";
import { useMarketActions } from "./hooks/useMarketActions.js";
import { useSeasonAdvance } from "./hooks/useSeasonAdvance.js";
import GameHeader from "./components/GameHeader.jsx";
import WorkforcePanel from "./components/WorkforcePanel.jsx";
import LandPanel from "./components/LandPanel.jsx";
import ResourcePanel from "./components/ResourcePanel.jsx";
import SeasonOutlookPanel from "./components/SeasonOutlookPanel.jsx";
import MarketPanel from "./components/MarketPanel.jsx";
import EventLog from "./components/EventLog.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./App.css";

const SAVE_KEY = "the-peculiar-institution-save-v1";

export default function App() {
  const { state, setState, currentPrice, setCurrentPrice, resetGame } = useGameSession(SAVE_KEY);
  const { toasts, addToast } = useToastNotifications();
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  function handleNewGame() {
    setOverlayDismissed(false);
    resetGame();
  }
  const { handleAdvanceSeason } = useSeasonAdvance({ state, setState, setCurrentPrice, addToast });
  const {
    handleAssignmentChange,
    handleSellTen,
    handleSellAll,
    handleBuyWorker,
    handleHireFreeWorker,
    handleDismissFreeWorker,
    handleBuyPlot,
  } = useMarketActions({ state, setState, currentPrice, addToast });

  const season = SEASONS[state.seasonIndex];

  // Expose run-log helpers on window for console access during playtesting.
  // Call window.downloadRunLog() in the browser console to save a JSON file.
  useEffect(() => {
    window.downloadRunLog = downloadLog;
    window.getRunLog = getLog;
  }, []);

  const maintenanceSoilGain = state.plots.length > 0
    ? Math.round(((state.assignments.maintenance || 0) * SOIL_RESTORE_PER_WORKER) / state.plots.length)
    : 0;
  // Only count tasks active in this season — other keys are stale from prior seasons.
  const activeTasks = SEASON_TASKS[season] ?? [];
  const totalAssigned = activeTasks.reduce((sum, t) => sum + (state.assignments[t] || 0), 0);
  const isOverAssigned = totalAssigned > state.workers.length;
  const unassignedWorkers = Math.max(0, state.workers.length - totalAssigned);
  const nextStatePreview = resolveSeason(state);
  const nextSeasonName = SEASONS[nextStatePreview.seasonIndex];

  const projectedLeafAfterAdvance =
    nextStatePreview.resources.rawTobacco + nextStatePreview.resources.curedTobacco;

  // Fixed Winter labor cost — only enslaved workers have ongoing upkeep; free workers are paid at hire.
  const totalWinterLaborCost = state.workers.reduce(
    (sum, w) => sum + (w.type === "enslaved" ? ENSLAVED_UPKEEP_PER_SEASON : 0),
    0
  );
  // Liquid assets after the next advance (cash + sellable cured tobacco).
  const projectedLiquidAssets =
    nextStatePreview.money + (nextStatePreview.resources.curedTobacco * currentPrice / 100);

  let debtRisk = {
    level: "low",
    title: "Low",
    detail: `Projected treasury after next advance: $${nextStatePreview.money.toFixed(2)}.`,
  };

  if (nextStatePreview.gameOver) {
    debtRisk = {
      level: "critical",
      title: "Foreclosure",
      detail: "Projected state crosses foreclosure conditions on next advance.",
    };
  } else if (nextStatePreview.money < 0 && projectedLeafAfterAdvance === 0) {
    debtRisk = {
      level: "high",
      title: "High",
      detail: "Negative cash with no inventory buffer after next advance.",
    };
  } else if (nextStatePreview.money < 0) {
    debtRisk = {
      level: "elevated",
      title: "Elevated",
      detail: "Negative cash projected, but inventory remains to sell.",
    };
  } else if (nextSeasonName === "Winter" && nextStatePreview.money < totalWinterLaborCost) {
    debtRisk = {
      level: "elevated",
      title: "Elevated",
      detail: `Treasury is slim heading into Winter upkeep costs ($${totalWinterLaborCost.toFixed(2)}).`,
    };
  } else if (season !== "Winter" && projectedLiquidAssets < totalWinterLaborCost) {
    debtRisk = {
      level: "elevated",
      title: "Elevated",
      detail: `Winter upkeep will cost $${totalWinterLaborCost.toFixed(2)}. Projected liquid assets ($${projectedLiquidAssets.toFixed(2)}) look short — sell tobacco or reduce workers before Winter.`,
    };
  }

  let curingOutlook = {
    timing: "Next Winter",
    shortfall: null,
    detail: "Curing risk becomes visible once Fall harvest projections are available.",
  };

  if (season === "Winter") {
    const curingCapacity = (state.assignments.curing || 0) * CURING_CAPACITY_PER_WORKER;
    const shortfall = Math.max(0, state.resources.rawTobacco - curingCapacity);
    curingOutlook = {
      timing: "This Winter",
      shortfall,
      detail:
        shortfall > 0
          ? `${shortfall.toLocaleString()} lbs are on track to rot with current curing allocation.`
          : "Current curing allocation can process all available raw leaf.",
    };
  } else if (season === "Fall") {
    const curingCapacity = (nextStatePreview.assignments.curing || 0) * CURING_CAPACITY_PER_WORKER;
    const shortfall = Math.max(0, nextStatePreview.resources.rawTobacco - curingCapacity);
    curingOutlook = {
      timing: "Next Winter",
      shortfall,
      detail:
        shortfall > 0
          ? `${shortfall.toLocaleString()} lbs are projected to rot if you advance with current plan.`
          : "Projected Winter curing plan can process all expected raw leaf.",
    };
  }

  // Fall harvest projection — visible during Spring (planting plan) and Summer (tending outcomes).
  let harvestOutlook = null;
  if (season === "Spring") {
    const plantedAfter = nextStatePreview.plots.filter(p => p.state === "planted").length;
    const totalPlots = state.plots.length;
    const fallowNow = state.plots.filter(p => p.state === "fallow").length;
    if (fallowNow > 0) {
      harvestOutlook = {
        label: "Planting Projection",
        value: `${plantedAfter} of ${totalPlots} plots planted`,
        detail: plantedAfter < fallowNow
          ? `${fallowNow - plantedAfter} fallow plot(s) left unplanted — assign more workers.`
          : "All fallow plots will be planted this Spring.",
      };
    }
  } else if (season === "Summer") {
    const tendedPlots = nextStatePreview.plots.filter(p => p.state === "tended");
    const projectedRaw = tendedPlots.reduce((sum, p) => {
      return sum + Math.floor(BASE_YIELD_PER_PLOT * (p.soilHealth / 100) * (p.yieldModifier ?? 1.0));
    }, 0);
    const projectedCured = Math.floor(projectedRaw / CURING_RATIO);
    harvestOutlook = {
      label: "Fall Harvest Projection",
      value: `~${projectedRaw.toLocaleString()} lbs raw leaf`,
      detail: `${tendedPlots.length} plot(s) tended \u2192 ~${projectedCured.toLocaleString()} lbs cured if fully processed in Winter.`,
    };
  }

  if (state.gameOver && !overlayDismissed) {
    return (
      <div className="overlay-screen game-over">
        <h1>The Plantation is Lost</h1>
        <p>
          Your creditors have called your debts. After repeated defaults with no
          tobacco left to liquidate, the operation has been foreclosed.
        </p>
        <p className="overlay-year">Year {state.year}</p>
        <div className="overlay-actions">
          <button className="btn btn-new-game" onClick={handleNewGame}>Try Again</button>
          <button className="btn btn-export" onClick={downloadLog}>Export Run Log</button>
          <button className="btn btn-view-ledger" onClick={() => setOverlayDismissed(true)}>View Final Ledger</button>
        </div>
      </div>
    );
  }

  if (state.victory && !overlayDismissed) {
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
        <div className="overlay-actions">
          <button className="btn btn-new-game" onClick={handleNewGame}>Play Again</button>
          <button className="btn btn-export" onClick={downloadLog}>Export Run Log</button>
          <button className="btn btn-view-ledger" onClick={() => setOverlayDismissed(true)}>View Final Ledger</button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <GameHeader year={state.year} season={season} money={state.money} />
        <main className="game-grid">
          <div className="col-left">
            <WorkforcePanel
              workers={state.workers.length}
              enslavedCount={state.workers.filter(w => w.type === "enslaved").length}
              freeCount={state.workers.filter(w => w.type === "free").length}
              season={season}
              assignments={state.assignments}
              plots={state.plots}
              onChange={handleAssignmentChange}
            />
            <LandPanel plots={state.plots} maintenanceSoilGain={maintenanceSoilGain} />
          </div>
          <div className="col-right">
            <ResourcePanel resources={state.resources} />
            <SeasonOutlookPanel
              nextSeason={nextSeasonName}
              nextYear={nextStatePreview.year}
              debtRisk={debtRisk}
              curingOutlook={curingOutlook}
              harvestOutlook={harvestOutlook}
            />
            <MarketPanel
              money={state.money}
              season={season}
              curedTobacco={state.resources.curedTobacco}
              currentPrice={currentPrice}
              onSellTen={handleSellTen}
              onSellAll={handleSellAll}
              onBuyWorker={handleBuyWorker}
              onHireFreeWorker={handleHireFreeWorker}
              onDismissFreeWorker={handleDismissFreeWorker}
              freeCount={state.workers.filter(w => w.type === "free").length}
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
          {!isOverAssigned && unassignedWorkers > 0 && (
            <p className="footer-warning">
              {unassignedWorkers} worker(s) are unassigned. Advancing will continue with idle labor.
            </p>
          )}
          <button className="btn btn-export" onClick={downloadLog}>
            Export Run Log
          </button>
          <button
            className="btn btn-reset"
            onClick={() => {
              if (window.confirm("Reset and start a new game? All progress will be lost.")) {
                handleNewGame();
              }
            }}
          >
            Reset Game
          </button>
        </footer>
        <div className="toast-overlay" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.color}`}>
              {toast.text}
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}
