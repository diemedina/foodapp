"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, BookIcon, CalendarIcon, HomeIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Hoy", Icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/semana", label: "Semana", Icon: CalendarIcon, match: (p: string) => p.startsWith("/semana") },
  { href: "/recetas", label: "Recetas", Icon: BookIcon, match: (p: string) => p.startsWith("/recetas") },
  { href: "/compras", label: "Compras", Icon: BagIcon, match: (p: string) => p.startsWith("/compras") },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="glass fixed inset-x-4 bottom-[calc(18px+env(safe-area-inset-bottom))] z-40 mx-auto grid h-[72px] max-w-[calc(28rem-2rem)] grid-cols-4 items-center gap-1 rounded-[28px] bg-white/75 px-2"
      style={{ viewTransitionName: "bottom-nav" }}
    >
      {ITEMS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`pressable flex h-14 flex-col items-center justify-center gap-[3px] rounded-[20px] text-[11px] ${
              active ? "bg-ink font-extrabold text-white shadow-[0_8px_18px_rgba(26,26,26,0.25)]" : "font-semibold text-subtle"
            }`}
          >
            <Icon className="size-[22px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
