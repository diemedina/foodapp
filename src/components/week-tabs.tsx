"use client";

import Link from "next/link";

/** Selector "Esta semana / Semana que viene" como links (la semana va en la URL). */
export function WeekTabs({ base, offset, ranges }: { base: string; offset: number; ranges: string[] }) {
  return (
    <div role="tablist" aria-label="Semana" className="glass grid grid-cols-2 gap-1 rounded-full p-1">
      {["Esta semana", "Semana que viene"].map((label, o) => {
        const on = offset === o;
        return (
          <Link
            key={label}
            role="tab"
            aria-selected={on}
            href={`${base}?w=${o}`}
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              window.history.replaceState(null, "", `${base}?w=${o}`);
            }}
            className={`flex h-11 flex-col items-center justify-center rounded-full leading-tight ${
              on ? "bg-ink text-white" : "text-ink"
            }`}
          >
            <span className="text-[13px] font-bold">{label}</span>
            <span className="text-[11px] opacity-75">{ranges[o]}</span>
          </Link>
        );
      })}
    </div>
  );
}
