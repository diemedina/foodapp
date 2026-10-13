import { ViewTransition } from "react";

/** Cada pantalla entra deslizando suave al navegar (View Transitions de React + Next). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="flex flex-col gap-[18px]">{children}</div>
    </ViewTransition>
  );
}
