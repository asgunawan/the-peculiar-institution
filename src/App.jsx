// App.jsx — Root coordinator for game panels and high-level flow.
import { SEASONS, SEASON_TASKS, SOIL_RESTORE_PER_WORKER } from "./gameLogic/constants.js";
import { useGameSession } from "./hooks/useGameSession.js";
import { useToastNotifications } from "./hooks/useToastNotifications.js";
import { useMarketActions } from "./hooks/useMarketActions.js";
import { useSeasonAdvance } from "./hooks/useSeasonAdvance.js";
import GameHeader from "./components/GameHeader.jsx";
import WorkforcePanel from "./components/WorkforcePanel.jsx";
import LandPanel from "./components/LandPanel.jsx";
import ResourcePanel from "./components/ResourcePanel.jsx";
import MarketPanel from "./components/MarketPanel.jsx";
import EventLog from "./components/EventLog.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./App.css";

const SAVE_KEY = "the-peculiar-institution-save-v1";

export default function App() {
  const { state, setState, currentPrice, setCurrentPrice, resetGame } = useGameSession(SAVE_KEY);
  const { toasts, addToast } = useToastNotifications();
  const { handleAdvanceSeason } = useSeasonAdvance({ state, setState, setCurrentPrice, addToast });
  const {
    handleAssignmentChange,
    handleSellTen,
    handleSellAll,
    handleBuyWorker,
    handleBuyPlot,
  } = useMarketActions({ state, setState, currentPrice, addToast });

  const season = SEASONS[state.seasonIndex];
  const maintenanceSoilGain = state.plots.length > 0
    ? Math.round(((state.assignments.maintenance || 0) * SOIL_RESTORE_PER_WORKER) / state.plots.length)
    : 0;
  // Only count tasks active in this season — other keys are stale from prior seasons.
  const activeTasks = SEASON_TASKS[season] ?? [];
  const totalAssigned = activeTasks.reduce((sum, t) => sum + (state.assignments[t] || 0), 0);
  const isOverAssigned = totalAssigned > state.workers;
  const unassignedWorkers = Math.max(0, state.workers - totalAssigned);

  if (state.gameOver) {
    return (
      <div className="overlay-screen game-over">
        <h1>The Plantation is Lost</h1>
        <p>
          Your creditors have called your debts. After repeated defaults with no
          tobacco left to liquidate, the operation has been foreclosed.
        </p>
        <p className="overlay-year">Year {state.year}</p>
        <button className="btn btn-new-game" onClick={resetGame}>Try Again</button>
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
        <button className="btn btn-new-game" onClick={resetGame}>Play Again</button>
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
              workers={state.workers}
              season={season}
              assignments={state.assignments}
              plots={state.plots}
              onChange={handleAssignmentChange}
            />
            <LandPanel plots={state.plots} maintenanceSoilGain={maintenanceSoilGain} />
          </div>
          <div className="col-right">
            <ResourcePanel resources={state.resources} />
            <MarketPanel
              money={state.money}
              curedTobacco={state.resources.curedTobacco}
              currentPrice={currentPrice}
              onSellTen={handleSellTen}
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
          {!isOverAssigned && unassignedWorkers > 0 && (
            <p className="footer-warning">
              {unassignedWorkers} worker(s) are unassigned. Advancing will continue with idle labor.
            </p>
          )}
          <button
            className="btn btn-reset"
            onClick={() => {
              if (window.confirm("Reset and start a new game? All progress will be lost.")) {
                resetGame();
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
