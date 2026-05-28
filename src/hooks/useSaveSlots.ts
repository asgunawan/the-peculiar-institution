import { useState, useCallback } from "react";
import { SLOT_COUNT, slotKey, serializeSlot, parseSlotData, readSlotMeta } from "../gameLogic/saveSlotUtils";
import type { GameState, SlotMeta } from "../gameLogic/types";

interface UseSaveSlotsOptions {
  state: GameState;
  currentPrice: number;
  onApplyGameData: (parsed: unknown) => void;
}

export function useSaveSlots({ state, currentPrice, onApplyGameData }: UseSaveSlotsOptions) {
  const [slotMetas, setSlotMetas] = useState<Array<SlotMeta | null>>(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => readSlotMeta(window.localStorage.getItem(slotKey(i))))
  );

  const saveToSlot = useCallback(
    (i: number) => {
      const data = serializeSlot(state, currentPrice);
      const raw = JSON.stringify(data);
      window.localStorage.setItem(slotKey(i), raw);
      setSlotMetas((prev) => {
        const next = [...prev];
        next[i] = readSlotMeta(raw);
        return next;
      });
    },
    [state, currentPrice]
  );

  const loadFromSlot = useCallback(
    (i: number) => {
      const raw = window.localStorage.getItem(slotKey(i));
      const data = parseSlotData(raw);
      if (!data) {
        alert("Slot is empty or the save data is corrupt.");
        return;
      }
      onApplyGameData(data);
    },
    [onApplyGameData]
  );

  const deleteSlot = useCallback((i: number) => {
    window.localStorage.removeItem(slotKey(i));
    setSlotMetas((prev) => {
      const next = [...prev];
      next[i] = null;
      return next;
    });
  }, []);

  return { slotMetas, saveToSlot, loadFromSlot, deleteSlot };
}