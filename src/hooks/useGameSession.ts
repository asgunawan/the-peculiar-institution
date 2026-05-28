import { useCallback, useEffect, useState } from "react";
import { createInitialState } from "../gameLogic/initialState.js";
import { getSellPrice } from "../gameLogic/seasonEngine.js";
import { normalizeSavedState } from "../gameLogic/saveNormalizer.js";
import { clearLog } from "../gameLogic/runLogger.js";
import type { GameState, SavePayload } from "../gameLogic/types";

function hasObjectShape(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

type SessionSeed = { state: GameState; currentPrice: number };

function loadSavedSession(saveKey: string): SessionSeed {
  const fresh = createInitialState();
  const defaultSession: SessionSeed = { state: fresh, currentPrice: getSellPrice(fresh.year) };

  try {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return defaultSession;

    const parsed = JSON.parse(raw) as unknown;
    if (!hasObjectShape(parsed)) return defaultSession;

    const savedState = parsed.state;
    const savedPrice = parsed.currentPrice;

    if (!hasObjectShape(savedState)) return defaultSession;
    if (typeof savedState.year !== "number") return defaultSession;
    if (!hasObjectShape(savedState.resources)) return defaultSession;
    if (!hasObjectShape(savedState.assignments)) return defaultSession;

    const normalized = normalizeSavedState(savedState as Partial<GameState>, fresh);
    return {
      state: normalized,
      currentPrice: typeof savedPrice === "number" ? savedPrice : getSellPrice(normalized.year),
    };
  } catch {
    return defaultSession;
  }
}

export function useGameSession(saveKey: string) {
  const [seed] = useState<SessionSeed>(() => loadSavedSession(saveKey));
  const [state, setState] = useState<GameState>(seed.state);
  const [currentPrice, setCurrentPrice] = useState<number>(seed.currentPrice);

  useEffect(() => {
    window.localStorage.setItem(saveKey, JSON.stringify({ state, currentPrice }));
  }, [saveKey, state, currentPrice]);

  const resetGame = useCallback(() => {
    clearLog();
    const fresh = createInitialState();
    setState(fresh);
    setCurrentPrice(getSellPrice(fresh.year));
  }, []);

  const handleTogglePlotRest = useCallback((plotId: number) => {
    setState((prev) => ({
      ...prev,
      plots: prev.plots.map((p) => (p.id === plotId ? { ...p, resting: !p.resting } : p)),
    }));
  }, []);

  const applyGameData = useCallback((parsed: unknown): boolean => {
    if (!hasObjectShape(parsed)) {
      alert("Invalid save data — required fields are missing or corrupt.");
      return false;
    }

    const savedState = parsed.state;
    const savedPrice = parsed.currentPrice;
    if (!hasObjectShape(savedState)) {
      alert("Invalid save data — required fields are missing or corrupt.");
      return false;
    }
    if (typeof savedState.year !== "number") {
      alert("Invalid save data — required fields are missing or corrupt.");
      return false;
    }
    if (!hasObjectShape(savedState.resources) || !hasObjectShape(savedState.assignments)) {
      alert("Invalid save data — required fields are missing or corrupt.");
      return false;
    }

    const fresh = createInitialState();
    const normalized = normalizeSavedState(savedState as Partial<GameState>, fresh);
    clearLog();
    setState(normalized);
    setCurrentPrice(typeof savedPrice === "number" ? savedPrice : getSellPrice(normalized.year));
    return true;
  }, []);

  const exportSave = useCallback(() => {
    const payload: SavePayload = { state, currentPrice };
    const raw = JSON.stringify(payload, null, 2);
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
    a.href = url;
    a.download = `tpi-save-${state.year}-${["Spring", "Summer", "Fall", "Winter"][state.seasonIndex]}-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state, currentPrice]);

  const importSave = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawText = typeof e.target?.result === "string" ? e.target.result : "";
          const parsed = JSON.parse(rawText) as unknown;
          applyGameData(parsed);
        } catch {
          alert("Could not read save file. Make sure it is a valid TPI JSON export.");
        }
      };
      reader.readAsText(file);
    },
    [applyGameData]
  );

  return {
    state,
    setState,
    currentPrice,
    setCurrentPrice,
    resetGame,
    handleTogglePlotRest,
    exportSave,
    importSave,
    applyGameData,
  };
}