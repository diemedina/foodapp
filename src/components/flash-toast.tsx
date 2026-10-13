"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "./toast";

/**
 * Muestra un aviso que viene de una redirección (por ejemplo "?guardada=nueva") y limpia la URL.
 * Usa `history.replaceState` (integrado con el router de Next) para no disparar una navegación
 * ni una View Transition extra.
 */
export function FlashToast({ message }: { message: string | null }) {
  const toast = useToast();
  const pathname = usePathname();
  const shown = useRef(false);
  useEffect(() => {
    if (!message || shown.current) return;
    shown.current = true;
    toast(message);
    window.history.replaceState(null, "", pathname);
  }, [message, toast, pathname]);
  return null;
}
