import Link from "next/link";
import { ViewTransition } from "react";
import { FlashToast } from "@/components/flash-toast";
import { MealIcon, PlusIcon } from "@/components/icons";
import { PageTransition } from "@/components/page-transition";
import { mondayOf, todayISO } from "@/lib/dates";
import { isMealId, MEALS, mealOf, mealsText } from "@/lib/meals";
import { getPlan, getRecipes } from "@/server/queries";

export default async function RecipesPage(props: PageProps<"/recetas">) {
  const params = await props.searchParams;
  const filter = isMealId(params.comida) ? params.comida : null;
  const recipes = await getRecipes();
  const plan = await getPlan(mondayOf(todayISO()));
  const uses = new Map<number, number>();
  for (const s of Object.values(plan)) uses.set(s.recipeId, (uses.get(s.recipeId) ?? 0) + 1);
  const visible = recipes.filter((r) => !filter || r.meals.includes(filter));

  return (
    <PageTransition>
      <FlashToast message={params.eliminada ? "Receta eliminada" : null} />
      <div className="flex items-end justify-between gap-2 px-1 pt-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-extrabold leading-none tracking-tight">Recetas</h1>
          <span className="text-muted">{visible.length === 1 ? "1 receta" : `${visible.length} recetas`}</span>
        </div>
        <Link
          href="/recetas/nueva"
          className="pressable flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink pl-3 pr-4 text-sm font-extrabold text-white shadow-lift"
        >
          <PlusIcon className="size-[18px]" strokeWidth={2.4} />
          Nueva receta
        </Link>
      </div>

      <nav aria-label="Filtrar por comida" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1.5 pt-0.5">
        {[{ id: null, name: "Todas", bg: "#1A1A1A", fg: "#FFFFFF" }, ...MEALS].map((f) => {
          const on = f.id === filter;
          return (
            <Link
              key={f.name}
              href={f.id ? `/recetas?comida=${f.id}` : "/recetas"}
              replace
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={`pressable flex h-11 shrink-0 items-center rounded-full px-[18px] text-sm font-semibold ${on ? "" : "glass"}`}
              style={on ? { background: f.bg, color: f.fg, border: `1px solid ${f.id ? f.fg : "#1A1A1A"}` } : undefined}
            >
              {f.name}
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <p className="glass rounded-[24px] p-6 text-center text-muted">No hay recetas para esta comida todavía.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((r) => {
            const showMeal = filter ?? r.meals[0] ?? "almuerzo";
            const m = mealOf(showMeal);
            const n = uses.get(r.id) ?? 0;
            return (
              <Link
                key={r.id}
                href={`/recetas/${r.id}`}
                aria-label={`${r.name}, ${mealsText(r.meals)}`}
                className="glass pressable flex min-w-0 flex-col gap-2.5 rounded-[24px] p-2 pb-3.5"
              >
                <ViewTransition name={`recipe-art-${r.id}`} share="morph">
                  <span
                    className="relative flex h-[104px] items-center justify-center rounded-[18px]"
                    style={{ background: m.bg, color: m.fg }}
                  >
                    <MealIcon meal={showMeal} className="size-10" strokeWidth={1.4} />
                    <span className="absolute right-2 top-2 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-ink">
                      {n === 0 ? "Sin usar" : `×${n}`}
                    </span>
                  </span>
                </ViewTransition>
                <span className="flex min-w-0 flex-col gap-0.5 px-1.5">
                  <span className="text-sm font-bold leading-tight">{r.name}</span>
                  <span className="text-xs text-muted">
                    {mealsText(r.meals)} · {r.ings.length} ingr.
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
