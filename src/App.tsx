import { useEffect, useState } from "react";
import {
  BASE_YIELD_PER_PLOT,
  CURING_CAPACITY_PER_WORKER,
  CURING_RATIO,
  SEASONS,
  ENSLAVED_UPKEEP_PER_SEASON,
  SEASON_TASKS,
  SOIL_RESTORE_PER_WORKER,
  SEASON_HINTS,
  FLAVOR_POOL,
} from "./gameLogic/constants";
import { resolveSeason } from "./gameLogic/seasonEngine";
import { downloadLog, getLog } from "./gameLogic/runLogger";
import { useGameSession } from "./hooks/useGameSession";
import { useSaveSlots } from "./hooks/useSaveSlots";
import { useToastNotifications } from "./hooks/useToastNotifications";
import { useMarketActions } from "./hooks/useMarketActions";
import { useSeasonAdvance } from "./hooks/useSeasonAdvance";
import GameHeader from "./components/GameHeader";
import WorkforcePanel from "./components/WorkforcePanel";
import LandPanel from "./components/LandPanel";
import ResourcePanel from "./components/ResourcePanel";
import SeasonOutlookPanel from "./components/SeasonOutlookPanel";
import MarketPanel from "./components/MarketPanel";
import EventLog from "./components/EventLog";
import SideMenu from "./components/SideMenu";
import ErrorBoundary from "./components/ErrorBoundary";
import type { SeasonName } from "./gameLogic/types";
import "./App.css";

const SAVE_KEY = "the-peculiar-institution-save-v1";

interface DebtRisk {
  level: string;
  title: string;
  detail: string;
}

interface CuringOutlook {
  timing: string;
  shortfall: number | null;
  detail: string;
}

interface HarvestOutlook {
  label: string;
  value: string;
  detail: string;
}

export default function App() {
  const {
    state,
    setState,
    currentPrice,
    setCurrentPrice,
    resetGame,
    handleTogglePlotRest,
    exportSave,
    importSave,
    applyGameData,
  } = useGameSession(SAVE_KEY);
  const { slotMetas, saveToSlot, loadFromSlot, deleteSlot } = useSaveSlots({
    state,
    currentPrice,
    onApplyGameData: applyGameData,
  });
  const { toasts, addToast } = useToastNotifications();
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  function handleNewGame() {
    setOverlayDismissed(false);
    resetGame();
  }

  function handleDismissFlavorText() {
    setState((prev) => ({ ...prev, pendingFlavorText: null }));
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

  const season = SEASONS[state.seasonIndex] as SeasonName;
  const totalWorkers = state.workers.length;
  const enslavedCount = state.workers.filter((w) => w.type === "enslaved").length;
  const freeCount = totalWorkers - enslavedCount;

  useEffect(() => {
    window.downloadRunLog = downloadLog;
    window.getRunLog = getLog;
  }, []);

  const maintenanceSoilGain =
    season === "Winter" && state.plots.length > 0
      ? Math.round(((state.assignments.maintenance || 0) * SOIL_RESTORE_PER_WORKER) / state.plots.length)
      : 0;

  const activeTasks = SEASON_TASKS[season] ?? [];
  const totalAssigned = activeTasks.reduce((sum, t) => sum + (state.assignments[t] || 0), 0);
  const isOverAssigned = totalAssigned > totalWorkers;
  const unassignedWorkers = Math.max(0, totalWorkers - totalAssigned);
  const nextStatePreview = resolveSeason(state, false);
  const nextSeasonName = SEASONS[nextStatePreview.seasonIndex];

  const projectedLeafAfterAdvance = nextStatePreview.resources.rawTobacco + nextStatePreview.resources.curedTobacco;

  const totalWinterLaborCost = state.workers.reduce(
    (sum, w) => sum + (w.type === "enslaved" ? ENSLAVED_UPKEEP_PER_SEASON : 0),
    0
  );

  const projectedLiquidAssets = nextStatePreview.money + (nextStatePreview.resources.curedTobacco * currentPrice) / 100;

  let debtRisk: DebtRisk = {
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

  let curingOutlook: CuringOutlook = {
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

  let harvestOutlook: HarvestOutlook | null = null;
  if (season === "Spring") {
    const plantedAfter = nextStatePreview.plots.filter((p) => p.state === "planted").length;
    const totalPlots = state.plots.length;
    const fallowNow = state.plots.filter((p) => p.state === "fallow").length;
    if (fallowNow > 0) {
      harvestOutlook = {
        label: "Planting Projection",
        value: `${plantedAfter} of ${totalPlots} plots planted`,
        detail:
          plantedAfter < fallowNow
            ? `${fallowNow - plantedAfter} fallow plot(s) left unplanted — assign more workers.`
            : "All fallow plots will be planted this Spring.",
      };
    }
  } else if (season === "Summer") {
    const tendedPlots = nextStatePreview.plots.filter((p) => p.state === "tended");
    const projectedRaw = tendedPlots.reduce((sum, p) => {
      return sum + Math.floor(BASE_YIELD_PER_PLOT * (p.soilHealth / 100) * (p.yieldModifier ?? 1.0));
    }, 0);
    const projectedCured = Math.floor(projectedRaw / CURING_RATIO);
    harvestOutlook = {
      label: "Fall Harvest Projection",
      value: `~${projectedRaw.toLocaleString()} lbs raw leaf`,
      detail: `${tendedPlots.length} plot(s) tended -> ~${projectedCured.toLocaleString()} lbs cured if fully processed in Winter.`,
    };
  } else if (season === "Fall") {
    const tendedPlots = state.plots.filter((p) => p.state === "tended");
    if (tendedPlots.length > 0) {
      const rawGained = Math.max(0, nextStatePreview.resources.rawTobacco - state.resources.rawTobacco);
      const projectedCured = Math.floor(rawGained / CURING_RATIO);
      harvestOutlook = {
        label: "Fall Harvest",
        value: `~${rawGained.toLocaleString()} lbs raw leaf`,
        detail: `${tendedPlots.length} plot(s) ready -> ~${projectedCured.toLocaleString()} lbs cured if fully processed this Winter.`,
      };
    }
  }

  // ── Header subtitle logic ────────────────────────────────────────────────
  // Priority: (1) pending flavor text (dismissable), (2) first-seen season hint, (3) rotating pool.
  const hintKey = `hint-${season}`;
  const subtitleIsDismissable = state.pendingFlavorText != null;
  const headerSubtitle: string = state.pendingFlavorText
    ? state.pendingFlavorText
    : !(state.seenMilestones ?? []).includes(hintKey)
    ? (SEASON_HINTS[season] ?? "")
    : FLAVOR_POOL[(state.year * 4 + state.seasonIndex) % FLAVOR_POOL.length];

  if (state.gameOver && !overlayDismissed) {
    return (
      <div className="overlay-screen game-over">
        <h1>The Plantation is Lost</h1>
        <p>
          Your creditors have called your debts. After repeated defaults with no tobacco left to liquidate, the operation has been
          foreclosed.
        </p>
        <p className="overlay-year">Year {state.year}</p>
        <div className="overlay-actions">
          <button className="btn btn-new-game" onClick={handleNewGame}>
            Try Again
          </button>
          <button className="btn btn-export" onClick={downloadLog}>
            Export Run Log
          </button>
          <button className="btn btn-view-ledger" onClick={() => setOverlayDismissed(true)}>
            View Final Ledger
          </button>
        </div>
      </div>
    );
  }

  if (state.victory && !overlayDismissed) {
    return (
      <div className="overlay-screen victory">
        <h1>A New Era Begins</h1>
        <p>
          It is 1793. A letter arrives from Connecticut. Eli Whitney has invented the cotton gin — a machine that separates cotton
          fiber from seed at fifty times the speed of hand-picking.
        </p>
        <p>The world is about to change. Your tobacco operation survives, but the future belongs to cotton.</p>
        <p className="overlay-year">Treasury: ${state.money.toFixed(0)}</p>
        <div className="overlay-actions">
          <button className="btn btn-new-game" onClick={handleNewGame}>
            Play Again
          </button>
          <button className="btn btn-export" onClick={downloadLog}>
            Export Run Log
          </button>
          <button className="btn btn-view-ledger" onClick={() => setOverlayDismissed(true)}>
            View Final Ledger
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <SideMenu
          slotMetas={slotMetas}
          onSaveToSlot={saveToSlot}
          onLoadFromSlot={loadFromSlot}
          onDeleteSlot={deleteSlot}
          onExportSave={exportSave}
          onImportSave={importSave}
          onNewGame={() => {
            if (window.confirm("Start a new game? All current progress will be lost.")) {
              handleNewGame();
            }
          }}
        />
        <GameHeader
          year={state.year}
          season={season}
          money={state.money}
          subtitle={headerSubtitle}
          onDismissSubtitle={subtitleIsDismissable ? handleDismissFlavorText : undefined}
        />
        <main className="game-grid">
          <div className="col-left">
            <WorkforcePanel
              workers={totalWorkers}
              enslavedCount={enslavedCount}
              freeCount={freeCount}
              season={season}
              assignments={state.assignments}
              plots={state.plots}
              onChange={handleAssignmentChange}
            />
            <LandPanel plots={state.plots} maintenanceSoilGain={maintenanceSoilGain} onTogglePlotRest={handleTogglePlotRest} />
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
              freeCount={freeCount}
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
            Advance to {SEASONS[(state.seasonIndex + 1) % SEASONS.length]} {state.seasonIndex === 3 ? state.year + 1 : state.year}
          </button>
          {isOverAssigned && <p className="footer-warning">Over-assigned — reduce worker assignments first.</p>}
          {!isOverAssigned && unassignedWorkers > 0 && (
            <p className="footer-warning">{unassignedWorkers} worker(s) are unassigned. Advancing will continue with idle labor.</p>
          )}
          <button className="btn btn-export" onClick={downloadLog}>
            Export Run Log
          </button>
        </footer>
        <div className="toast-overlay" aria-live="polite" aria-atomic="false">
          {toasts.map((toast: { id: string; color: string; text: string }) => (
            <div key={toast.id} className={`toast toast-${toast.color}`}>
              {toast.text}
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}