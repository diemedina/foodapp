"use client";

import { useEffect, type ReactNode } from "react";
import { syncAppData, useAppStore } from "@/lib/app-store";

export function AppDataSync() {
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === "visible") void syncAppData();
    };
    void syncAppData();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("online", sync);
    const timer = window.setInterval(sync, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("online", sync);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}

export function AppDataFallback({ children }: { children: ReactNode }) {
  const error = useAppStore((state) => state.error);
  if (!error) return children;
  return (
    <div role="alert" className="glass rounded-[24px] p-5 text-center">
      <p>No se pudieron cargar los datos.</p>
      <button type="button" className="mt-2 h-11 px-4 font-bold" onClick={() => void syncAppData(true)}>
        Reintentar
      </button>
    </div>
  );
}
