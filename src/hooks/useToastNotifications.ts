import { useCallback, useRef, useState } from "react";

const DEFAULT_TOAST_DURATION_MS = 1800;

export interface Toast {
  id: string;
  text: string;
  color: string;
}

export type AddToast = (text: string, color?: string, durationMs?: number) => void;

export function useToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fallbackCounter = useRef(0);

  const makeId = useCallback(() => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    fallbackCounter.current += 1;
    return `toast-${fallbackCounter.current}`;
  }, []);

  const addToast = useCallback<AddToast>(
    (text, color = "accent", durationMs = DEFAULT_TOAST_DURATION_MS) => {
      const id = makeId();
      setToasts((prev) => [...prev, { id, text, color }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, durationMs);
    },
    [makeId]
  );

  return { toasts, addToast };
}