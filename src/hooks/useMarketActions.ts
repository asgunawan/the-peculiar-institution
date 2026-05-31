import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ENSLAVED_PURCHASE_COST,
  FIELD_NAMES,
  FREE_WORKER_WAGE_PER_SEASON,
  PLOT_COST,
  BASE_HOUSING_CAPACITY,
  CABIN_HOUSING_CAPACITY,
  CABIN_COST,
  TOOL_SHED_COST,
} from "../gameLogic/constants";
import { pushLog } from "../gameLogic/logUtils";
import type { Assignments, Building, GameState } from "../gameLogic/types";

type ToastFn = (text: string, color?: string, durationMs?: number) => void;

interface UseMarketActionsParams {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState>>;
  currentPrice: number;
  addToast: ToastFn;
}

export function useMarketActions({ state, setState, currentPrice, addToast }: UseMarketActionsParams) {
  const getNextWorkerId = useCallback(() => {
    return state.workers.reduce((maxId, worker) => Math.max(maxId, worker.id || 0), 0) + 1;
  }, [state.workers]);

  const handleAssignmentChange = useCallback(
    (newAssignments: Assignments) => {
      setState((prev) => ({
        ...prev,
        assignments: newAssignments,
        maintenanceTarget: newAssignments.maintenance ?? prev.maintenanceTarget,
      }));
    },
    [setState]
  );

  const handleSellTobacco = useCallback(
    (requestedLbs: number | "all") => {
      const available = state.resources.curedTobacco;
      const lbsToSell = requestedLbs === "all" ? available : Math.min(available, Math.max(0, requestedLbs));

      if (lbsToSell <= 0) return;

      const earnedDollars = parseFloat(((lbsToSell * currentPrice) / 100).toFixed(2));
      const remaining = available - lbsToSell;
      const { log, logCounter } = pushLog(
        state.log,
        state.logCounter,
        `Sold ${lbsToSell} lbs of tobacco at ${currentPrice}¢/lb for $${earnedDollars.toFixed(2)}. ${remaining} lbs remain in storage.`
      );

      setState({
        ...state,
        money: parseFloat((state.money + earnedDollars).toFixed(2)),
        resources: { ...state.resources, curedTobacco: remaining },
        log,
        logCounter,
      });
      addToast(`+$${earnedDollars.toFixed(2)}`, "green");
    },
    [state, setState, currentPrice, addToast]
  );

  const handleSellTen = useCallback(() => {
    handleSellTobacco(10);
  }, [handleSellTobacco]);

  const handleSellAll = useCallback(() => {
    handleSellTobacco("all");
  }, [handleSellTobacco]);

  const handleBuyWorker = useCallback(() => {
    const cabinCount = (state.buildings ?? []).filter((b) => b.type === "quarter_cabin").length;
    const housingCapacity = BASE_HOUSING_CAPACITY + cabinCount * CABIN_HOUSING_CAPACITY;
    const enslavedCount = state.workers.filter((w) => w.type === "enslaved").length;

    if (enslavedCount >= housingCapacity) {
      addToast("No quarters available — build a cabin row first", "red");
      return;
    }
    if (state.money < ENSLAVED_PURCHASE_COST) return;

    const newId = getNextWorkerId();
    const { log, logCounter } = pushLog(
      state.log,
      state.logCounter,
      `Purchased an enslaved worker at auction for $${ENSLAVED_PURCHASE_COST}.`
    );

    setState({
      ...state,
      money: parseFloat((state.money - ENSLAVED_PURCHASE_COST).toFixed(2)),
      workers: [...state.workers, { id: newId, type: "enslaved" }],
      log,
      logCounter,
    });
    addToast("+1 enslaved worker purchased", "accent");
  }, [state, setState, addToast, getNextWorkerId]);

  const handleHireFreeWorker = useCallback(() => {
    if (state.money < FREE_WORKER_WAGE_PER_SEASON) {
      addToast("Not enough cash to hire", "red");
      return;
    }
    const newId = getNextWorkerId();
    const { log, logCounter } = pushLog(
      state.log,
      state.logCounter,
      `Hired a seasonal free worker for $${FREE_WORKER_WAGE_PER_SEASON} (paid now). They will return home after this season.`
    );

    setState({
      ...state,
      money: parseFloat((state.money - FREE_WORKER_WAGE_PER_SEASON).toFixed(2)),
      workers: [...state.workers, { id: newId, type: "free" }],
      log,
      logCounter,
    });
    addToast(`+1 seasonal worker (-$${FREE_WORKER_WAGE_PER_SEASON})`, "accent");
  }, [state, setState, addToast, getNextWorkerId]);

  const handleDismissFreeWorker = useCallback(() => {
    let lastFreeIdx = -1;
    for (let i = state.workers.length - 1; i >= 0; i -= 1) {
      if (state.workers[i].type === "free") {
        lastFreeIdx = i;
        break;
      }
    }
    if (lastFreeIdx === -1) return;

    const newWorkers = [...state.workers.slice(0, lastFreeIdx), ...state.workers.slice(lastFreeIdx + 1)];
    const { log, logCounter } = pushLog(state.log, state.logCounter, "Sent a seasonal free worker home early.");

    setState({ ...state, workers: newWorkers, log, logCounter });
    addToast("-1 free worker released", "red");
  }, [state, setState, addToast]);

  const handleBuyPlot = useCallback(() => {
    if (state.money < PLOT_COST) return;

    const newId = state.plots.length + 1;
    const chosenName = FIELD_NAMES[(newId - 1) % FIELD_NAMES.length];
    const { log, logCounter } = pushLog(
      state.log,
      state.logCounter,
      `Acquired ${chosenName} (Plot ${newId}) — virgin land, full soil health.`
    );

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
          resting: false,
        },
      ],
      log,
      logCounter,
    });
    addToast(`+1 plot acquired (${chosenName})`, "accent");
  }, [state, setState, addToast]);

  const handleBuildCabin = useCallback(() => {
    if (state.money < CABIN_COST) return;
    const newId = (state.buildings ?? []).reduce((max, b) => Math.max(max, b.id), 0) + 1;
    const newBuilding: Building = { id: newId, type: "quarter_cabin", builtYear: state.year };
    const { log, logCounter } = pushLog(
      state.log,
      state.logCounter,
      `Built a Quarter Cabin Row ($${CABIN_COST}). Housing capacity increased by 6.`
    );
    setState({
      ...state,
      money: parseFloat((state.money - CABIN_COST).toFixed(2)),
      buildings: [...(state.buildings ?? []), newBuilding],
      log,
      logCounter,
    });
    addToast("+6 housing capacity", "accent");
  }, [state, setState, addToast]);

  const handleBuyToolShed = useCallback(() => {
    if (state.money < TOOL_SHED_COST) return;
    if ((state.buildings ?? []).some((b) => b.type === "tool_shed")) return;
    const newId = (state.buildings ?? []).reduce((max, b) => Math.max(max, b.id), 0) + 1;
    const newBuilding: Building = { id: newId, type: "tool_shed", builtYear: state.year };
    const { log, logCounter } = pushLog(
      state.log,
      state.logCounter,
      `Purchased a Tool Cache ($${TOOL_SHED_COST}) from a passing trader. Iron hoes and proper tools — harvest yields improved by 10%.`
    );
    setState({
      ...state,
      money: parseFloat((state.money - TOOL_SHED_COST).toFixed(2)),
      buildings: [...(state.buildings ?? []), newBuilding],
      log,
      logCounter,
    });
    addToast("+10% harvest yield (Tool Cache)", "accent");
  }, [state, setState, addToast]);

  const handleConvertToProvision = useCallback(
    (plotId: number) => {
      const plot = state.plots.find((p) => p.id === plotId);
      if (!plot || plot.state !== "fallow" || plot.cropType !== "tobacco") return;
      const tobaccoPlots = state.plots.filter((p) => p.cropType === "tobacco");
      if (tobaccoPlots.length <= 1) {
        addToast("Cannot convert your only tobacco plot — buy another plot first.", "warn");
        return;
      }
      const { log, logCounter } = pushLog(
        state.log,
        state.logCounter,
        `${plot.name} converted to Provision Grounds. Workers will tend kitchen gardens and keep chickens — enslaved upkeep reduced to $4/season.`
      );
      setState({
        ...state,
        plots: state.plots.map((p) =>
          p.id === plotId ? { ...p, cropType: "provision", resting: false } : p
        ),
        log,
        logCounter,
      });
      addToast(`${plot.name} → Provision Grounds (-$3/worker/season upkeep)`, "accent");
    },
    [state, setState, addToast]
  );

  return {
    handleAssignmentChange,
    handleSellTen,
    handleSellAll,
    handleBuyWorker,
    handleHireFreeWorker,
    handleDismissFreeWorker,
    handleBuyPlot,
    handleBuildCabin,
    handleBuyToolShed,
    handleConvertToProvision,
  };
}