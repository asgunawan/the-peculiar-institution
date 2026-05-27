import { useCallback, useEffect, useState } from "react";
import { createInitialState } from "../gameLogic/initialState.js";
import { getSellPrice } from "../gameLogic/seasonEngine.js";
import { normalizeSavedState } from "../gameLogic/saveNormalizer.js";
import { clearLog } from "../gameLogic/runLogger.js";

function loadSavedSession(saveKey) {
  const fresh = createInitialState();
  const defaultSession = { state: fresh, currentPrice: getSellPrice(fresh.year) };

  try {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return defaultSession;

    const parsed = JSON.parse(raw);
    const savedState = parsed?.state;
    const savedPrice = parsed?.currentPrice;

    if (!savedState || typeof savedState.year !== "number" || !savedState.resources || !savedState.assignments) {
      return defaultSession;
    }

    return {
      state: normalizeSavedState(savedState, fresh),
      currentPrice: typeof savedPrice === "number" ? savedPrice : getSellPrice(savedState.year),
    };
  } catch {
    return defaultSession;
  }
}

/**
 * Owns game state and persistence for the current browser session.
 * @param {string} saveKey
 */
export function useGameSession(saveKey) {
  const [seed] = useState(() => loadSavedSession(saveKey));
  const [state, setState] = useState(seed.state);
  const [currentPrice, setCurrentPrice] = useState(seed.currentPrice);

  // MVP strategy: persist the lightweight session on every relevant change.
  useEffect(() => {
    window.localStorage.setItem(saveKey, JSON.stringify({ state, currentPrice }));
  }, [saveKey, state, currentPrice]);

  const resetGame = useCallback(() => {
    clearLog();
    const fresh = createInitialState();
    setState(fresh);
    setCurrentPrice(getSellPrice(fresh.year));
  }, []);

  const handleTogglePlotRest = useCallback((plotId) => {
    setState((prev) => ({
      ...prev,
      plots: prev.plots.map((p) =>
        p.id === plotId ? { ...p, resting: !p.resting } : p
      ),
    }));
  }, []);

  return {
    state,
    setState,
    currentPrice,
    setCurrentPrice,
    resetGame,
    handleTogglePlotRest,
  };
}
