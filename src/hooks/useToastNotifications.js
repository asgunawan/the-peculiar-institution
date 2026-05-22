import { useCallback, useRef, useState } from "react";

const DEFAULT_TOAST_DURATION_MS = 1800;

/**
 * UI-only toast queue with auto-expiring notifications.
 * @returns {{toasts:Array<{id:string,text:string,color:string}>,addToast:(text:string,color?:string,durationMs?:number)=>void}}
 */
export function useToastNotifications() {
  const [toasts, setToasts] = useState([]);
  const fallbackCounter = useRef(0);

  const makeId = useCallback(() => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    fallbackCounter.current += 1;
    return `toast-${fallbackCounter.current}`;
  }, []);

  const addToast = useCallback((text, color = "accent", durationMs = DEFAULT_TOAST_DURATION_MS) => {
    const id = makeId();
    setToasts((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, durationMs);
  }, [makeId]);

  return { toasts, addToast };
}
