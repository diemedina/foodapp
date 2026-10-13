"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { ChevronRightIcon, CloseIcon, MealIcon, PlusIcon, SparkleIcon, StarIcon } from "@/components/icons";
import { PickerSheet, type PickTarget } from "@/components/picker-sheet";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { WeekTabs } from "@/components/week-tabs";
import { addDays, dayOfMonth } from "@/lib/dates";
import { DAY_SHORT, DAYS, MEALS, slotKey } from "@/lib/meals";
import { leftoverLinks, plannedCount } from "@/lib/planning";
import type { PlanMap, Recipe, Template, Usage } from "@/lib/types";
import { applyTemplate, autofillWeek, clearWeek, copyWeek, deleteTemplate, saveTemplate } from "@/server/actions";

export function WeekPlanner(props: {
  offset: number;
  monday: string;
  currentMonday: string;
  todayIndex: number;
  initialDay: number;
  ranges: string[];
  plan: PlanMap;
  recipes: Recipe[];
  usage: Usage;
  templates: Template[];
}) {
  const { offset, monday, plan, recipes } = props;
  const toast = useToast();
  const [day, setDay] = useState(props.initialDay);
  const [pick, setPick] = useState<PickTarget>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [pending, startTransition] = useTransition();
  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const links = useMemo(() => leftoverLinks(plan), [plan]);

  const planned = plannedCount(plan);
  const dayDone = MEALS.filter((m) => plan[slotKey(day, m.id)]).length;
  const target = offset === 0 ? "esta semana" : "la semana que viene";

  const run = (fn: () => Promise<unknown>, message: (r: unknown) => string) =>
    startTransition(async () => {
      try {
        const res = await fn();
        toast(message(res));
      } catch (e) {
        toast(e instanceof Error ? e.message : "No se pudo guardar.", "error");
      }
    });

  return (
    <>
      <WeekTabs base="/semana" offset={offset} ranges={props.ranges} />

      <section className="relative flex flex-col gap-4 overflow-hidden rounded-[28px] bg-ink/90 p-5 text-white shadow-[0_18px_40px_rgba(26,26,26,0.25)]">
        <div aria-hidden className="absolute -right-12 -top-16 size-44 rounded-full bg-orange opacity-45 blur-[50px]" />
        <div aria-hidden className="absolute -bottom-20 -left-10 size-40 rounded-full bg-green opacity-40 blur-[50px]" />
        <span className="relative text-xs font-semibold uppercase tracking-wider text-white/75">{props.ranges[offset]}</span>
        <h1 className="relative flex flex-col text-[28px] font-extrabold leading-[1.15] tracking-tight">
          <span>{offset === 0 ? "¿Qué comemos" : "Planificá la"}</span>
          <span>{offset === 0 ? "esta semana?" : "semana que viene"}</span>
        </h1>
        <div className="relative flex flex-col gap-2">
          <div className="flex justify-between text-[13px] text-white/80">
            <span>Comidas planificadas</span>
            <span className="font-bold text-white">{planned} / 28</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-orange transition-[width] duration-700"
              style={{ width: `${Math.round((planned / 28) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <div role="tablist" aria-label="Días" className="grid grid-cols-7 gap-1.5">
        {DAYS.map((name, d) => {
          const on = d === day;
          const isToday = d === props.todayIndex;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${name} ${dayOfMonth(addDays(monday, d))}`}
              onClick={() => setDay(d)}
              className={`flex h-[74px] flex-col items-center justify-center gap-1 rounded-[20px] ${
                on ? "border border-ink bg-ink text-white" : `glass ${isToday ? "!border-[1.5px] !border-orange" : ""}`
              }`}
            >
              <span className="text-[11px] font-semibold opacity-80">{isToday ? "Hoy" : DAY_SHORT[d]}</span>
              <span className="text-[17px] font-extrabold leading-none">{dayOfMonth(addDays(monday, d))}</span>
              <span className="mt-0.5 flex gap-0.5">
                {MEALS.map((m) => (
                  <span
                    key={m.id}
                    className="size-[5px] rounded-full"
                    style={{
                      background: plan[slotKey(d, m.id)]
                        ? on
                          ? "#FFAD57"
                          : m.fg
                        : on
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(26,26,26,0.15)",
                    }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-xl font-extrabold tracking-tight">
          {DAYS[day]} {dayOfMonth(addDays(monday, day))}
        </h2>
        <span className="text-[13px] text-muted">{dayDone} de 4 comidas</span>
      </div>

      <div key={day} className="animate-fade-up flex flex-col gap-2.5">
        {MEALS.map((m) => {
          const key = slotKey(day, m.id);
          const slot = plan[key];
          const r = slot ? recipesById.get(slot.recipeId) : undefined;
          const cookFor = links.cookFor[key];
          let sub = r ? r.ings.map((i) => i.name).join(", ") : "Sin planificar";
          if (slot?.leftover) sub = links.from[key] ? `Sobras de ${links.from[key]}` : "Sobras";
          else if (cookFor) sub = `Cociná doble: rinde para ${cookFor}`;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPick({ day, meal: m.id })}
              aria-label={`${m.name} del ${DAYS[day]}: ${r ? r.name : "sin planificar"}`}
              className="glass flex min-h-[84px] w-full items-center gap-3.5 rounded-[24px] p-3 text-left"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px]" style={{ background: m.bg, color: m.fg }}>
                <MealIcon meal={m.id} className="size-6" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted">{m.name}</span>
                  {(slot?.leftover || cookFor) && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        slot?.leftover ? "bg-[#E8E4F8] text-[#463A86]" : "bg-orange-200 text-orange-800"
                      }`}
                    >
                      {slot?.leftover ? "Sobras" : "Cociná doble"}
                    </span>
                  )}
                </span>
                <span className={`text-base font-bold leading-tight ${r ? "text-ink" : "text-muted"}`}>
                  {r ? r.name : "Elegir comida"}
                </span>
                <span className="truncate text-xs text-muted">{sub}</span>
              </span>
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  r ? "bg-white/80 text-ink" : "bg-ink text-white"
                }`}
              >
                {r ? <ChevronRightIcon className="size-[18px]" /> : <PlusIcon className="size-[18px]" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => autofillWeek({ weekStart: monday }),
              (r) => {
                const added = (r as { added: number } | undefined)?.added ?? 0;
                return added ? `Sumamos ${added} comidas sugeridas` : "La semana ya estaba completa";
              },
            )
          }
          className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-white shadow-lift disabled:opacity-60"
        >
          <SparkleIcon className="size-[18px]" />
          Completar con sugerencias
        </button>
        <span className="-mt-0.5 text-center text-xs text-muted">
          Prioriza lo que hace más semanas no comés y evita repetir.
        </span>
        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          className="glass flex h-[52px] items-center justify-center gap-2 rounded-full text-sm font-bold"
        >
          <StarIcon className="size-[18px] text-[#E08A2E]" />
          Planes favoritos
          <span className="rounded-full bg-orange-200 px-2 py-0.5 text-xs font-extrabold text-orange-800">
            {props.templates.length}
          </span>
        </button>
        <div className="flex gap-2.5">
          {offset === 1 && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => copyWeek({ fromWeekStart: props.currentMonday, toWeekStart: monday }), () => "Copiamos esta semana")
              }
              className="glass h-12 flex-1 rounded-full text-[13px] font-bold"
            >
              Repetir esta semana
            </button>
          )}
          <button
            type="button"
            disabled={pending || planned === 0}
            onClick={() => run(() => clearWeek({ weekStart: monday }), () => "Semana vaciada")}
            className="glass h-12 flex-1 rounded-full text-[13px] font-bold disabled:opacity-50"
          >
            Vaciar semana
          </button>
        </div>
      </div>

      <PickerSheet
        target={pick}
        onClose={() => setPick(null)}
        onMoved={(d) => setDay(d)}
        weekStart={monday}
        currentMonday={props.currentMonday}
        plan={plan}
        recipes={recipes}
        usage={props.usage}
      />

      <TemplatesSheet
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        templates={props.templates}
        recipesById={recipesById}
        monday={monday}
        target={target}
      />
    </>
  );
}

function TemplatesSheet({
  open,
  onClose,
  templates,
  recipesById,
  monday,
  target,
}: {
  open: boolean;
  onClose: () => void;
  templates: Template[];
  recipesById: Map<number, Recipe>;
  monday: string;
  target: string;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const inputId = useId();

  return (
    <Sheet open={open} onClose={onClose} label="Planes favoritos">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-extrabold tracking-tight">Planes favoritos</h2>
        <span className="text-muted">Aplicá un plan guardado a {target} o guardá la semana actual.</span>
      </div>
      <form
        className="flex flex-col gap-2 rounded-[20px] bg-white/75 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return setError("Poné un nombre para el plan.");
          startTransition(async () => {
            try {
              await saveTemplate({ name, weekStart: monday });
              toast(`Guardamos "${name.trim()}"`);
              setName("");
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo guardar.");
            }
          });
        }}
      >
        <label htmlFor={inputId} className="text-[13px] font-bold">
          Guardar {target} como favorito
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Ej: Semana liviana"
            className="h-12 min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-4 text-[15px]"
          />
          <button type="submit" disabled={pending} className="h-12 shrink-0 rounded-full bg-ink px-4 text-sm font-bold text-white">
            Guardar
          </button>
        </div>
        {error && (
          <span role="alert" className="text-xs font-semibold text-danger">
            {error}
          </span>
        )}
      </form>
      <div className="flex flex-col gap-2">
        {templates.length === 0 && <p className="px-1 py-2 text-muted">Todavía no guardaste planes.</p>}
        {templates.map((t) => {
          const ids = [...new Set(Object.values(t.plan).map((s) => s.recipeId))].filter((id) => recipesById.has(id));
          return (
            <div key={t.id} className="flex flex-col gap-2.5 rounded-[20px] border border-ink/5 bg-white/85 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                  <strong className="text-base">{t.name}</strong>
                  <span className="text-xs text-muted">{Object.keys(t.plan).length} comidas</span>
                </span>
                <button
                  type="button"
                  aria-label={`Borrar plan ${t.name}`}
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteTemplate({ templateId: t.id });
                      toast("Plan borrado");
                    })
                  }
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {ids.slice(0, 5).map((id) => {
                  const r = recipesById.get(id)!;
                  const m = MEALS.find((x) => x.id === r.meals[0]) ?? MEALS[0];
                  return (
                    <span key={id} className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: m.bg, color: m.fg }}>
                      {r.name}
                    </span>
                  );
                })}
                {ids.length > 5 && (
                  <span className="rounded-full bg-[#EFE7DC] px-2 py-0.5 text-[11px] font-bold text-[#4A4038]">
                    +{ids.length - 5}
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await applyTemplate({ templateId: t.id, weekStart: monday });
                      toast(`Aplicamos "${t.name}"`);
                      onClose();
                    } catch {
                      toast("No se pudo aplicar.", "error");
                    }
                  })
                }
                className="h-11 rounded-full bg-orange text-sm font-extrabold text-ink"
              >
                Aplicar a {target}
              </button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
