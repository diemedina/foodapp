"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckIcon, CloseIcon } from "./icons";

type Toast = { id: number; message: string; tone: "ok" | "error" };
type ToastFn = (message: string, tone?: Toast["tone"]) => void;

const ToastContext = createContext<ToastFn>(() => {});

/** Vibración corta como confirmación táctil (si el teléfono lo permite). */
export function buzz() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* sin soporte */
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const show = useCallback<ToastFn>((message, tone = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setToast({ id: counter.current, message, tone });
    if (tone === "ok") buzz();
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-28 z-[60] flex justify-center" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className="animate-toast flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-2.5 pr-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(26,26,26,0.28)]"
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                toast.tone === "ok" ? "bg-green text-ink" : "bg-danger text-white"
              }`}
            >
              {toast.tone === "ok" ? <CheckIcon className="animate-pop size-4" /> : <CloseIcon className="size-4" />}
            </span>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastFn {
  return useContext(ToastContext);
}
