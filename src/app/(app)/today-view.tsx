"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BagIcon, CalendarIcon, ChevronRightIcon, ClockIcon, MealIcon, PlusIcon, SwapIcon } from "@/components/icons";
import { PickerSheet, type PickTarget } from "@/components/picker-sheet";
import { MEAL_IDS, MEALS, MOMENT, mealOf, slotKey } from "@/lib/meals";
import type { MealId, PlanMap, Recipe, Usage } from "@/lib/types";

export function TodayView(props: {
  today: string;
  todayIndex: number;
  dateText: string;
  monday: string;
  nowMeal: MealId;
  plan: PlanMap;
  recipes: Recipe[];
  usage: Usage;
  lateWeek: boolean;
  nextPlanned: number;
  nextRange: string;
  thisPlanned: number;
  pending: number;
}) {
  const { todayIndex, nowMeal, plan, recipes } = props;
  const [chosen, setChosen] = useState<MealId | null>(null);
  const [pick, setPick] = useState<PickTarget>(null);
  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  const shown = chosen ?? nowMeal;
  const info = mealOf(shown);
  const slot = plan[slotKey(todayIndex, shown)];
  const recipe = slot ? recipesById.get(slot.recipeId) : undefined;
  const done = MEAL_IDS.filter((m) => plan[slotKey(todayIndex, m)]).length;
  const rest = [1, 2, 3].map((o) => MEAL_IDS[(MEAL_IDS.indexOf(shown) + o) % 4]);
  const planDone = props.nextPlanned >= 28;

  return (
    <>
      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-[13px] font-bold text-muted">Hoy, {props.dateText}</span>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
          {chosen ? `Tu ${info.name.toLowerCase()}` : MOMENT[nowMeal]}
        </h1>
      </div>

      {props.lateWeek && (
        <section className="relative flex flex-col gap-3 overflow-hidden rounded-[24px] bg-ink/90 p-4 text-white shadow-[0_14px_30px_rgba(26,26,26,0.22)]">
          <div aria-hidden className="absolute -right-10 -top-14 size-36 rounded-full bg-orange opacity-50 blur-[44px]" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-orange-200 text-orange-800">
              {planDone ? <BagIcon /> : <CalendarIcon />}
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="text-[15px]">
                {planDone
                  ? props.todayIndex <= 5
                    ? "Día de súper"
                    : "La semana que viene está lista"
                  : props.todayIndex === 4
                    ? "Es viernes: planificá la semana"
                    : "Planificá la semana que viene"}
              </strong>
              <span className="text-[13px] text-white/80">
                {planDone
                  ? `La lista para ${props.nextRange} ya está armada.`
                  : `${props.nextPlanned} de 28 comidas · ${props.nextRange}`}
              </span>
            </span>
          </div>
          {!planDone && (
            <div className="relative h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-orange transition-[width] duration-700"
                style={{ width: `${Math.round((props.nextPlanned / 28) * 100)}%` }}
              />
            </div>
          )}
          <Link
            href={planDone ? "/compras?w=1" : "/semana?w=1&d=0"}
            className="pressable relative flex h-[46px] items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-ink"
          >
            {planDone ? "Ver lista de compras" : "Seguir planificando"}
            <ChevronRightIcon className="size-4" />
          </Link>
        </section>
      )}

      <div role="tablist" aria-label="Comidas de hoy" className="no-scrollbar -mx-4 -mt-1.5 flex gap-0.5 overflow-x-auto px-3">
        {[{ id: null, name: "Ahora" }, ...MEALS].map((t) => {
          const on = t.id === chosen;
          return (
            <button
              key={t.name}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setChosen(t.id as MealId | null)}
              className={`flex h-11 shrink-0 flex-col items-center justify-center gap-1 px-2.5 text-sm ${
                on ? "font-bold text-ink" : "font-medium text-[#7A6E62]"
              }`}
            >
              {t.name}
              <span className={`size-1 rounded-full ${on ? "bg-ink" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className="relative pt-[18px]">
        <div aria-hidden className="absolute inset-x-7 top-0 h-[60px] rounded-[28px] border border-white/60 bg-white/40" />
        <div aria-hidden className="absolute inset-x-3.5 top-[9px] h-[60px] rounded-[28px] border border-white/70 bg-white/55" />
        <article key={shown} className="glass animate-fade-up relative flex flex-col gap-3 rounded-[28px] bg-white/80 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-11 items-center justify-center rounded-full" style={{ background: info.bg, color: info.fg }}>
                <MealIcon meal={shown} className="size-[22px]" />
              </span>
              {shown === nowMeal && (
                <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Ahora</span>
              )}
            </div>
            <button
              type="button"
              aria-label={`Cambiar ${info.name.toLowerCase()}`}
              onClick={() => setPick({ day: todayIndex, meal: shown })}
              className="flex size-11 items-center justify-center rounded-full border border-ink/10 bg-white shadow-[0_4px_12px_rgba(26,26,26,0.08)]"
            >
              {recipe ? <SwapIcon className="size-[18px]" /> : <PlusIcon className="size-[18px]" />}
            </button>
          </div>
          <div className="flex flex-col gap-0.5 px-0.5">
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
              {recipe ? recipe.name : `Elegí tu ${info.name.toLowerCase()}`}
            </h2>
            <span className="text-[13px] text-muted">
              {info.name} · {info.time}
              {recipe ? ` · ${recipe.ings.length} ingredientes` : " · sin planificar"}
              {slot?.leftover ? " · sobras" : ""}
            </span>
          </div>
          {recipe ? (
            <Link
              href={`/recetas/${recipe.id}`}
              aria-label={`Ver receta ${recipe.name}`}
              className="relative flex h-[200px] items-center justify-center overflow-hidden rounded-[22px]"
              style={{ background: info.bg, color: info.fg }}
            >
              <CardArt meal={shown} />
              <span className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
                {recipe.ings.slice(0, 3).map((i) => (
                  <span key={i.name} className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink">
                    {i.name}
                  </span>
                ))}
                {recipe.ings.length > 3 && (
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink">
                    +{recipe.ings.length - 3}
                  </span>
                )}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPick({ day: todayIndex, meal: shown })}
              className="relative flex h-[200px] items-center justify-center overflow-hidden rounded-[22px]"
              style={{ background: info.bg, color: info.fg }}
            >
              <CardArt meal={shown} />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink">
                Tocá para elegir
              </span>
            </button>
          )}
        </article>
      </div>

      <div className="flex items-baseline justify-between px-1 pt-1">
        <h2 className="text-xl font-extrabold tracking-tight">El resto del día</h2>
        <span className="text-[13px] text-muted">{done} de 4 planificadas</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rest.map((meal) => {
          const m = mealOf(meal);
          const s = plan[slotKey(todayIndex, meal)];
          const r = s ? recipesById.get(s.recipeId) : undefined;
          return (
            <button
              key={meal}
              type="button"
              onClick={() => setChosen(meal)}
              aria-label={`${m.name}, ${m.time}: ${r ? r.name : "sin planificar"}`}
              className="glass flex min-h-[76px] w-full items-center gap-3.5 rounded-[22px] py-2.5 pl-2.5 pr-3.5 text-left"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px]" style={{ background: m.bg, color: m.fg }}>
                <MealIcon meal={meal} className="size-6" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className={`text-base font-bold leading-tight ${r ? "text-ink" : "text-muted"}`}>
                  {r ? r.name : "Sin planificar"}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <ClockIcon className="size-3.5" />
                  {m.time}
                  <span className="size-[3px] rounded-full bg-[#C9BCAD]" />
                  {m.name}
                </span>
              </span>
              <ChevronRightIcon className="size-5 text-muted" />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/semana?w=0" className="glass pressable flex flex-col items-start gap-2.5 rounded-[22px] p-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#FFF1C9] text-[#7A5300]">
            <CalendarIcon className="size-[18px]" />
          </span>
          <span className="flex flex-col">
            <span className="text-xs text-muted">Esta semana</span>
            <strong className="text-xl">
              {props.thisPlanned}
              <span className="text-[13px] font-medium text-muted"> / 28</span>
            </strong>
          </span>
        </Link>
        <Link href="/compras" className="glass pressable flex flex-col items-start gap-2.5 rounded-[22px] p-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-green-200 text-green-800">
            <BagIcon className="size-[18px]" />
          </span>
          <span className="flex flex-col">
            <span className="text-xs text-muted">Por comprar</span>
            <strong className="text-xl">
              {props.pending}
              <span className="text-[13px] font-medium text-muted"> productos</span>
            </strong>
          </span>
        </Link>
      </div>

      <PickerSheet
        target={pick}
        onClose={() => setPick(null)}
        weekStart={props.monday}
        currentMonday={props.monday}
        plan={plan}
        recipes={recipes}
        usage={props.usage}
      />
    </>
  );
}

function CardArt({ meal }: { meal: MealId }) {
  return (
    <>
      <span aria-hidden className="absolute size-[170px] rounded-full bg-white/45" />
      <span aria-hidden className="absolute -right-8 -top-8 size-[120px] rounded-full bg-white/30" />
      <MealIcon meal={meal} className="relative size-[84px]" strokeWidth={1.1} />
    </>
  );
}
