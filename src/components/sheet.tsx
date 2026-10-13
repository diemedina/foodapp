"use client";

import { useEffect } from "react";

/** Panel que sube desde abajo, con fondo desenfocado. Se cierra con Escape o tocando afuera. */
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="animate-fade absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[4px] active:scale-100"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="animate-sheet no-scrollbar relative mx-auto flex max-h-[88dvh] w-full max-w-md flex-col gap-3.5 overflow-y-auto rounded-t-[32px] border border-b-0 border-white/90 bg-white/85 px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_rgba(26,26,26,0.12)] backdrop-blur-[28px]"
      >
        <div className="mx-auto my-0.5 h-[5px] w-10 shrink-0 rounded-full bg-ink/20" />
        {children}
      </div>
    </div>
  );
}
