"use client";

import { useAppStore } from "@/lib/app-store";

export function RecipeUsage({ id }: { id: number }) {
  const uses = useAppStore(({ data }) =>
    data ? Object.values(data.plans[data.weeks[0]]).filter((slot) => slot.recipeId === id).length : undefined,
  );

  return (
    <span className="flex flex-col">
      <strong className="text-[15px]">{uses ?? "—"}</strong>
      <span className="text-xs text-muted">{uses === 1 ? "vez esta semana" : "veces esta semana"}</span>
    </span>
  );
}
