import { useCallback } from "react";
import { FIELD_NAMES, PLOT_COST, WORKER_COST } from "../gameLogic/constants.js";
import { pushLog } from "../gameLogic/logUtils.js";

/**
 * Market and assignment related callbacks.
 */
export function useMarketActions({ state, setState, currentPrice, addToast }) {
  /**
   * Persists player task allocation and maintenance memory.
   */
  const handleAssignmentChange = useCallback((newAssignments) => {
    setState((prev) => ({
      ...prev,
      assignments: newAssignments,
      maintenanceTarget: newAssignments.maintenance ?? prev.maintenanceTarget,
    }));
  }, [setState]);

  /**
   * Sells cured tobacco at the current market price.
   */
  const handleSellTobacco = useCallback((requestedLbs) => {
    const available = state.resources.curedTobacco;
    const lbsToSell =
      requestedLbs === "all"
        ? available
        : Math.min(available, Math.max(0, requestedLbs));

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
  }, [state, setState, currentPrice, addToast]);

  const handleSellTen = useCallback(() => {
    handleSellTobacco(10);
  }, [handleSellTobacco]);

  const handleSellAll = useCallback(() => {
    handleSellTobacco("all");
  }, [handleSellTobacco]);

  /**
   * Buys one additional worker if treasury can afford it.
   */
  const handleBuyWorker = useCallback(() => {
    if (state.money < WORKER_COST) return;

    const { log, logCounter } = pushLog(
      state.log,
      state.logCounter,
      `Purchased one additional worker for $${WORKER_COST}.`
    );

    setState({
      ...state,
      money: parseFloat((state.money - WORKER_COST).toFixed(2)),
      workers: state.workers + 1,
      log,
      logCounter,
    });
    addToast("+1 worker hired", "accent");
  }, [state, setState, addToast]);

  /**
   * Buys one new plot and assigns a thematic field name.
   */
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
    handleBuyPlot,
  };
}
