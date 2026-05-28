import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ENSLAVED_PURCHASE_COST, FIELD_NAMES, FREE_WORKER_WAGE_PER_SEASON, PLOT_COST } from "../gameLogic/constants";
import { pushLog } from "../gameLogic/logUtils";
import type { Assignments, GameState } from "../gameLogic/types";

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

  return {
    handleAssignmentChange,
    handleSellTen,
    handleSellAll,
    handleBuyWorker,
    handleHireFreeWorker,
    handleDismissFreeWorker,
    handleBuyPlot,
  };
}