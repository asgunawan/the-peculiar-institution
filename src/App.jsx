// App.jsx — Root component. Owns all game state and coordinates panels.
import { useState, useCallback, useEffect } from "react";
import { createInitialState } from "./gameLogic/initialState.js";
import { resolveSeason, getSellPrice } from "./gameLogic/seasonEngine.js";
import {
  SEASONS,
  SEASON_TASKS,
  WORKER_COST,
  PLOT_COST,
  CURING_RATIO,
  SOIL_RESTORE_PER_WORKER,
} from "./gameLogic/constants.js";
import GameHeader from "./components/GameHeader.jsx";
import WorkforcePanel from "./components/WorkforcePanel.jsx";
import LandPanel from "./components/LandPanel.jsx";
import ResourcePanel from "./components/ResourcePanel.jsx";
import MarketPanel from "./components/MarketPanel.jsx";
import EventLog from "./components/EventLog.jsx";
import "./App.css";

const SAVE_KEY = "the-peculiar-institution-save-v1";
const FIELD_NAMES = [
  "Home Field",
  "North Quarter",
  "River Bottom",
  "Back Forty",
  "Oak Ridge",
  "Creek Side",
  "Sandy Loam",
  "Pine Hollow",
  "Red Clay",
  "Bottom Acre",
  "Hilltop",
  "Marsh Edge",
  "East Clearing",
  "West Hollow",
  "Stone Row",
];

function loadSavedSession() {
  const fresh = createInitialState();
  const defaultSession = { state: fresh, currentPrice: getSellPrice(fresh.year) };

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSession;

    const parsed = JSON.parse(raw);
    const savedState = parsed?.state;
    const savedPrice = parsed?.currentPrice;

    if (!savedState || typeof savedState.year !== "number" || !savedState.resources || !savedState.assignments) {
      return defaultSession;
    }

    return {
      state: savedState,
      currentPrice: typeof savedPrice === "number" ? savedPrice : getSellPrice(savedState.year),
    };
  } catch {
    return defaultSession;
  }
}

export default function App() {
  const [seed] = useState(loadSavedSession);
  const [state, setState] = useState(seed.state);
  const [currentPrice, setCurrentPrice] = useState(seed.currentPrice);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((text, color = "accent") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 1800);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ state, currentPrice })
    );
  }, [state, currentPrice]);

  const handleAssignmentChange = useCallback((newAssignments) => {
    setState((s) => ({
      ...s,
      assignments: newAssignments,
      // Track maintenance intent independently so season transitions restore it.
      maintenanceTarget: newAssignments.maintenance ?? s.maintenanceTarget,
    }));
  }, []);

  const handleAdvanceSeason = useCallback(() => {
    const currentSeason = SEASONS[state.seasonIndex];
    const currentActiveTasks = SEASON_TASKS[currentSeason] ?? [];
    const assignedNow = currentActiveTasks.reduce(
      (sum, t) => sum + (state.assignments[t] || 0),
      0
    );
    const unassignedWorkersNow = Math.max(0, state.workers - assignedNow);

    if (unassignedWorkersNow > 0) {
      const proceed = window.confirm(
        `You still have ${unassignedWorkersNow} unassigned worker(s). Continue to next season anyway?`
      );
      if (!proceed) return;
    }

    const next = resolveSeason(state);
    const rawGained = next.resources.rawTobacco - state.resources.rawTobacco;
    const curedGained = next.resources.curedTobacco - state.resources.curedTobacco;
    const moneyDelta = next.money - state.money;

    if (rawGained > 0) {
      addToast(`+${rawGained.toLocaleString()} lbs raw leaf`, "accent");
    }
    if (curedGained > 0) {
      addToast(`+${curedGained.toLocaleString()} lbs cured`, "green");
    }

    if (currentSeason === "Winter") {
      const rawUsedForCuring = Math.max(0, curedGained) * CURING_RATIO;
      const rawRotted = Math.max(0, state.resources.rawTobacco - rawUsedForCuring - next.resources.rawTobacco);
      if (rawRotted > 0) {
        addToast(`-${rawRotted.toLocaleString()} lbs rotted`, "red");
      }
    }

    if (moneyDelta < 0) {
      addToast(`-$${Math.abs(moneyDelta).toFixed(2)} upkeep`, "red");
    }

    setState(next);
    setCurrentPrice(getSellPrice(next.year));
  }, [state, addToast]);

  const handleSellTobacco = useCallback((requestedLbs) => {
    const available = state.resources.curedTobacco;
    const lbsToSell =
      requestedLbs === "all"
        ? available
        : Math.min(available, Math.max(0, requestedLbs));

    if (lbsToSell <= 0) return;

    // price is cents/lb; convert to dollars
    const earnedDollars = parseFloat(
      ((lbsToSell * currentPrice) / 100).toFixed(2)
    );
    const remaining = available - lbsToSell;

    setState({
      ...state,
      money: parseFloat((state.money + earnedDollars).toFixed(2)),
      resources: { ...state.resources, curedTobacco: remaining },
      log: [
        `Sold ${lbsToSell} lbs of tobacco at ${currentPrice}¢/lb for $${earnedDollars.toFixed(2)}. ${remaining} lbs remain in storage.`,
        ...state.log,
      ].slice(0, 20),
    });

    addToast(`+$${earnedDollars.toFixed(2)}`, "green");
  }, [state, currentPrice, addToast]);

  const handleSellTen = useCallback(() => {
    handleSellTobacco(10);
  }, [handleSellTobacco]);

  const handleSellAll = useCallback(() => {
    handleSellTobacco("all");
  }, [handleSellTobacco]);

  const handleBuyWorker = useCallback(() => {
    if (state.money < WORKER_COST) return;

    setState({
      ...state,
      money: parseFloat((state.money - WORKER_COST).toFixed(2)),
      workers: state.workers + 1,
      log: [`Purchased one additional worker for $${WORKER_COST}.`, ...state.log].slice(0, 20),
    });

    addToast("+1 worker hired", "accent");
  }, [state, addToast]);

  const handleBuyPlot = useCallback(() => {
    if (state.money < PLOT_COST) return;

    const newId = state.plots.length + 1;
    const chosenName = FIELD_NAMES[(newId - 1) % FIELD_NAMES.length];

    setState({
      ...state,
      money: parseFloat((state.money - PLOT_COST).toFixed(2)),
      plots: [
        ...state.plots,
        {
          id: newId,
          name: chosenName,
          soilHealth: 100,
          cropType: "tobacco",
          state: "fallow",
          yieldModifier: 1.0,
        },
      ],
      log: [`Acquired ${chosenName} (Plot ${newId}) — virgin land, full soil health.`, ...state.log].slice(0, 20),
    });

    addToast(`+1 plot acquired (${chosenName})`, "accent");
  }, [state, addToast]);

  const handleNewGame = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
    setCurrentPrice(getSellPrice(fresh.year));
  }, []);

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
  );
}
