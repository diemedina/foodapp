"use client";

import { useMemo, useTransition } from "react";
import { addDays, dayOfMonth } from "@/lib/dates";
import { DAY_SHORT, DAYS, mealOf, slotKey } from "@/lib/meals";
import { lastUseBadge, leftoverCandidates, rankRecipesForSlot } from "@/lib/planning";
import type { MealId, PlanMap, Recipe, Usage } from "@/lib/types";
import { clearSlot, moveSlot, setSlot } from "@/server/actions";
import { CheckCircle } from "./check-circle";
import { HistoryIcon, LeftoverIcon, StarIcon } from "./icons";
import { Sheet } from "./sheet";
import { useToast } from "./toast";

const TONE = {
  recent: "bg-orange-200 text-orange-800",
  week: "bg-[#FFF1C9] text-[#7A5300]",
  old: "bg-green-200 text-green-800",
};

export type PickTarget = { day: number; meal: MealId } | null;

export function PickerSheet({
  target,
  onClose,
  onMoved,
  weekStart,
  currentMonday,
  plan,
  recipes,
  usage,
}: {
  target: PickTarget;
  onClose: () => void;
  onMoved?: (day: number) => void;
  weekStart: string;
  currentMonday: string;
  plan: PlanMap;
  recipes: Recipe[];
  usage: Usage;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  if (!target) return null;

  const { day, meal } = target;
  const info = mealOf(meal);
  const key = slotKey(day, meal);
  const current = plan[key];
  const currentRecipe = current ? recipesById.get(current.recipeId) : undefined;
  const ranked = rankRecipesForSlot({ recipes, meal, plan, exceptKey: key, usage, weekStart });
  const leftovers = leftoverCandidates(plan, day, meal, recipesById);

  const run = (fn: () => Promise<unknown>, message: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast(message);
        onClose();
      } catch (e) {
        toast(e instanceof Error ? e.message : "No se pudo guardar.", "error");
      }
    });

  return (
    <Sheet open onClose={onClose} label={`Elegir ${info.name.toLowerCase()}`}>
      <div className="flex items-center gap-3">
        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: info.bg, color: info.fg }}>
          {info.name}
        </span>
        <h2 className="text-[22px] font-extrabold tracking-tight">
          {DAYS[day]} {dayOfMonth(addDays(weekStart, day))}
        </h2>
      </div>

      {currentRecipe && (
        <section className="flex flex-col gap-2 rounded-[20px] bg-white/70 p-3">
          <span className="text-[13px] font-bold">Mover {currentRecipe.name} a otro día</span>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((name, d) => {
              const isCur = d === day;
              const other = plan[slotKey(d, meal)];
              const otherName = other ? recipesById.get(other.recipeId)?.name : undefined;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={isCur || pending}
                  aria-label={isCur ? `${name} (día actual)` : `Mover a ${name}${otherName ? `, intercambia con ${otherName}` : ""}`}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const res = await moveSlot({ weekStart, day, meal, toDay: d });
                        toast(`${res?.swapped ? "Intercambiada con el" : "Movida al"} ${name.toLowerCase()}`);
                        onMoved?.(d);
                        onClose();
                      } catch {
                        toast("No se pudo mover.", "error");
                      }
                    })
                  }
                  className={`flex h-[54px] flex-col items-center justify-center gap-0.5 rounded-[14px] border ${
                    isCur ? "border-ink bg-ink text-white" : "border-ink/10 bg-white/85"
                  }`}
                >
                  <span className="text-[10px] font-semibold">{DAY_SHORT[d]}</span>
                  <span className="text-sm font-extrabold leading-none">{dayOfMonth(addDays(weekStart, d))}</span>
                  <span
                    className="size-1 rounded-full"
                    style={{ background: other ? (isCur ? "#FFAD57" : info.fg) : "transparent" }}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-muted">Si ese día ya tiene {info.name.toLowerCase()}, se intercambian.</span>
        </section>
      )}

      {leftovers.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="px-0.5 text-[13px] font-bold">Usar sobras</span>
          {leftovers.map(({ recipe, from }) => {
            const on = current?.leftover && current.recipeId === recipe.id;
            return (
              <button
                key={recipe.id}
                type="button"
                role="radio"
                aria-checked={Boolean(on)}
                disabled={pending}
                onClick={() =>
                  run(
                    () => setSlot({ weekStart, day, meal, recipeId: recipe.id, leftover: true }),
                    `Sobras de ${recipe.name} · cociná doble`,
                  )
                }
                className={`flex min-h-[60px] items-center gap-3 rounded-[20px] py-2.5 pl-2.5 pr-3.5 text-left ${
                  on ? "border border-[#463A86] bg-[#E8E4F8]" : "border border-dashed border-[#463A86]/35 bg-white/70"
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#E8E4F8] text-[#463A86]">
                  <LeftoverIcon />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-bold">{recipe.name}</span>
                  <span className="text-xs text-muted">De {from} · cociná doble</span>
                </span>
                <CheckCircle checked={Boolean(on)} dark />
              </button>
            );
          })}
        </section>
      )}

      <section className="flex flex-col gap-2" role="radiogroup" aria-label="Recetas">
        <span className="px-0.5 text-[13px] font-bold">Elegir receta</span>
        {ranked.length === 0 && (
          <p className="px-1 py-3 text-muted">No hay recetas para esta comida. Creá una en Recetas.</p>
        )}
        {ranked.map(({ recipe, suggested }) => {
          const on = Boolean(current && !current.leftover && current.recipeId === recipe.id);
          const badge = lastUseBadge({ usage, recipeId: recipe.id, weekStart, currentMonday, plan, exceptKey: key });
          return (
            <button
              key={recipe.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={pending}
              onClick={() =>
                run(
                  () => setSlot({ weekStart, day, meal, recipeId: recipe.id }),
                  `${info.name} del ${DAYS[day].toLowerCase()} listo`,
                )
              }
              className="flex min-h-16 items-center gap-3.5 rounded-[20px] px-3.5 py-2.5 text-left"
              style={{
                background: on ? info.bg : "rgba(255,255,255,0.7)",
                border: on ? `1px solid ${info.fg}` : "1px solid rgba(26,26,26,0.06)",
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[15px] font-bold">{recipe.name}</span>
                  {suggested && (
                    <span className="flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold text-white">
                      <StarIcon className="size-2.5 fill-orange text-orange" />
                      Sugerida
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-muted">{recipe.ings.map((i) => i.name).join(", ")}</span>
                <span
                  className={`mt-0.5 flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[11px] font-bold ${TONE[badge.tone]}`}
                >
                  <HistoryIcon className="size-3" />
                  {badge.text}
                </span>
              </span>
              <CheckCircle checked={on} dark />
            </button>
          );
        })}
      </section>

      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          disabled={!current || pending}
          onClick={() => run(() => clearSlot({ weekStart, day, meal }), `Quitada del ${DAYS[day].toLowerCase()}`)}
          className="h-[52px] flex-1 rounded-full border border-ink/10 bg-white/70 text-sm font-bold text-danger disabled:opacity-40"
        >
          Quitar del día
        </button>
        <button type="button" onClick={onClose} className="h-[52px] flex-1 rounded-full bg-ink text-sm font-bold text-white">
          Listo
        </button>
      </div>
    </Sheet>
  );
}
