"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { CheckCircle } from "@/components/check-circle";
import { BagIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon, HomeIcon, PlusIcon, SortIcon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { buzz, useToast } from "@/components/toast";
import { WeekTabs } from "@/components/week-tabs";
import { HOUSEHOLD_CATEGORIES, householdCategory, sectionDot } from "@/lib/sections";
import type { ShoppingList } from "@/lib/shopping";
import type { HouseholdItem } from "@/lib/types";
import {
  addHouseholdItem,
  clearBoughtHousehold,
  removeHouseholdItem,
  saveStoreOrder,
  setAtHome,
  setChecked,
  setHouseholdChecked,
  uncheckAll,
} from "@/server/actions";

type Patch =
  | { type: "check"; key: string; checked: boolean }
  | { type: "home"; checked: boolean; id: number }
  | { type: "uncheckAll" };

export function ShoppingView(props: {
  offset: number;
  monday: string;
  ranges: string[];
  list: ShoppingList;
  household: HouseholdItem[];
  sectionOrder: string[];
}) {
  const { monday } = props;
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [showOrder, setShowOrder] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Limpieza");
  const householdInputId = useId();

  // Tachar es inmediato en pantalla; el servidor confirma detrás.
  const [state, applyPatch] = useOptimistic(
    { list: props.list, household: props.household },
    (cur, patch: Patch) => {
      if (patch.type === "check") {
        return {
          ...cur,
          list: {
            ...cur.list,
            groups: cur.list.groups.map((g) => ({
              ...g,
              items: g.items.map((i) => (i.key === patch.key ? { ...i, checked: patch.checked } : i)),
            })),
          },
        };
      }
      if (patch.type === "home") {
        return { ...cur, household: cur.household.map((h) => (h.id === patch.id ? { ...h, checked: patch.checked } : h)) };
      }
      return {
        list: { ...cur.list, groups: cur.list.groups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, checked: false })) })) },
        household: cur.household.map((h) => ({ ...h, checked: false })),
      };
    },
  );

  const items = state.list.groups.flatMap((g) => g.items);
  const total = items.length + state.household.length;
  const done = items.filter((i) => i.checked).length + state.household.filter((h) => h.checked).length;
  const pending = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const optimistic = (patch: Patch, fn: () => Promise<unknown>, message?: string) => {
    buzz();
    startTransition(async () => {
      applyPatch(patch);
      try {
        await fn();
        if (message) toast(message);
      } catch {
        toast("No se pudo guardar.", "error");
      }
    });
  };

  const plain = (fn: () => Promise<unknown>, message: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast(message);
      } catch (e) {
        toast(e instanceof Error ? e.message : "No se pudo guardar.", "error");
      }
    });

  return (
    <>
      <div className="flex items-end justify-between gap-2 px-1 pt-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-extrabold leading-none tracking-tight">Compras</h1>
          <span className="text-muted">{total} productos</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Ordenar como mi súper"
            onClick={() => setShowOrder(true)}
            className="glass flex size-11 items-center justify-center rounded-full"
          >
            <SortIcon className="size-[18px]" />
          </button>
          <button
            type="button"
            disabled={done === 0}
            onClick={() => optimistic({ type: "uncheckAll" }, () => uncheckAll({ weekStart: monday }), "Lista desmarcada")}
            className="glass h-11 rounded-full px-4 text-[13px] font-bold disabled:opacity-50"
          >
            Desmarcar
          </button>
        </div>
      </div>

      <WeekTabs base="/compras" offset={props.offset} ranges={props.ranges} />

      <div className="glass flex items-center gap-4 rounded-[24px] px-[18px] py-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-[#C4F0D6] text-green-800">
          <BagIcon className="size-[26px]" strokeWidth={1.8} />
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold">{pending} por comprar</span>
            <span className="text-[13px] text-muted">{pct}% listo</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-green transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {state.list.groups.length === 0 && state.list.atHome.length === 0 && (
        <p className="glass rounded-[24px] px-5 py-6 text-center text-muted">
          No hay comidas planificadas para esta semana. Elegí recetas en Semana y los ingredientes aparecen acá.
        </p>
      )}

      {state.list.groups.map((g) => {
        const left = g.items.filter((i) => !i.checked).length;
        return (
          <section key={g.section} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1.5">
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                <span className="size-2.5 rounded-full" style={{ background: g.dot }} />
                {g.section}
              </h2>
              <span className="text-xs font-semibold text-muted">{left === 0 ? "Listo" : `${left} de ${g.items.length}`}</span>
            </div>
            <div className="glass rounded-[24px] px-2 py-1">
              {g.items.map((it, idx) => (
                <div key={it.key} className={`flex items-center ${idx ? "border-t border-ink/5" : ""}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={it.checked}
                    onClick={() =>
                      optimistic({ type: "check", key: it.key, checked: !it.checked }, () =>
                        setChecked({ weekStart: monday, itemKey: it.key, checked: !it.checked }),
                      )
                    }
                    className="flex min-h-[62px] min-w-0 flex-1 items-center gap-3 py-2.5 pl-2 pr-1 text-left active:scale-100"
                  >
                    <CheckCircle checked={it.checked} />
                    <span className={`flex min-w-0 flex-1 flex-col ${it.checked ? "opacity-50" : ""}`}>
                      <span className={`text-[15px] font-semibold ${it.checked ? "line-through" : ""}`}>{it.name}</span>
                      <span className="truncate text-xs text-muted">{it.recipes.join(", ")}</span>
                    </span>
                    {it.amount && (
                      <span className={`whitespace-nowrap rounded-full bg-white/75 px-2.5 py-1 text-[13px] font-bold ${it.checked ? "opacity-50" : ""}`}>
                        {it.amount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Ya tengo ${it.name} en casa`}
                    onClick={() => plain(() => setAtHome({ name: it.name, atHome: true }), `${it.name}: ya lo tenés en casa`)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-subtle"
                  >
                    <HomeIcon className="size-[18px]" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {state.list.atHome.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Ya tenés en casa">
          <div className="flex items-center justify-between px-1.5">
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <HomeIcon className="size-4 text-green-800" strokeWidth={2.2} />
              Ya tenés en casa
            </h2>
            <span className="text-xs font-semibold text-muted">No se compran</span>
          </div>
          <div className="rounded-[24px] border border-dashed border-green-800/30 bg-green-200/55 px-2 py-1.5">
            {state.list.atHome.map((p, idx) => (
              <div key={p.name} className={`flex min-h-[52px] items-center gap-2.5 py-1 pl-2 pr-1 ${idx ? "border-t border-green-800/10" : ""}`}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-xs text-[#4A5A4E]">{p.amount ? `${p.amount} para la semana` : "Sin cantidad cargada"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => plain(() => setAtHome({ name: p.name, atHome: false }), `${p.name} volvió a la lista`)}
                  className="h-10 rounded-full border border-green-800/25 bg-white/80 px-3 text-xs font-extrabold text-green-800"
                >
                  Lo necesito
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2" aria-label="Para la casa">
        <div className="flex items-center justify-between px-1.5">
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <span className="size-2.5 rounded-full bg-[#8FD0E8]" />
            Para la casa
          </h2>
          {state.household.some((h) => h.checked) && (
            <button
              type="button"
              onClick={() => plain(() => clearBoughtHousehold(), "Quitamos lo comprado")}
              className="h-9 rounded-full px-2.5 text-xs font-bold text-danger"
            >
              Quitar comprados
            </button>
          )}
        </div>
        <div className="glass flex flex-col gap-3 rounded-[24px] p-3.5">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = name.trim();
              if (!value) return;
              setName("");
              startTransition(async () => {
                try {
                  const res = await addHouseholdItem({ name: value, category });
                  toast(res?.added ? `${value} agregado a la lista` : `${value} ya estaba en la lista`);
                } catch {
                  toast("No se pudo agregar.", "error");
                }
              });
            }}
          >
            <label htmlFor={householdInputId} className="sr-only">
              Agregar producto para la casa
            </label>
            <input
              id={householdInputId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agregar producto…"
              className="h-12 min-w-0 flex-1 rounded-full border border-ink/10 bg-white/85 px-4 text-[15px]"
            />
            <button type="submit" aria-label="Agregar" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              <PlusIcon />
            </button>
          </form>
          <div role="radiogroup" aria-label="Categoría" className="flex flex-wrap gap-1.5">
            {HOUSEHOLD_CATEGORIES.map((c) => {
              const on = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCategory(c.id)}
                  className="h-9 rounded-full px-3.5 text-[13px] font-semibold"
                  style={{
                    background: on ? c.bg : "rgba(255,255,255,0.7)",
                    color: on ? c.fg : "#1A1A1A",
                    border: on ? `1px solid ${c.fg}` : "1px solid rgba(26,26,26,0.08)",
                  }}
                >
                  {c.id}
                </button>
              );
            })}
          </div>
          {state.household.length > 0 && (
            <div className="flex flex-col border-t border-ink/5">
              {state.household.map((h, idx) => {
                const c = householdCategory(h.category);
                return (
                  <div key={h.id} className={`flex items-center gap-1 ${idx < state.household.length - 1 ? "border-b border-ink/5" : ""}`}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={h.checked}
                      onClick={() =>
                        optimistic({ type: "home", id: h.id, checked: !h.checked }, () =>
                          setHouseholdChecked({ id: h.id, checked: !h.checked }),
                        )
                      }
                      className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-0.5 py-2 text-left active:scale-100"
                    >
                      <CheckCircle checked={h.checked} />
                      <span className={`min-w-0 flex-1 text-[15px] font-semibold ${h.checked ? "line-through opacity-50" : ""}`}>
                        {h.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${h.checked ? "opacity-50" : ""}`}
                        style={{ background: c.bg, color: c.fg }}
                      >
                        {h.category}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Quitar ${h.name}`}
                      onClick={() => plain(() => removeHouseholdItem({ id: h.id }), `${h.name} quitado`)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <OrderSheet open={showOrder} onClose={() => setShowOrder(false)} initial={props.sectionOrder} />
    </>
  );
}

function OrderSheet({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: string[] }) {
  const toast = useToast();
  const [order, setOrder] = useState(initial);
  const [pending, startTransition] = useTransition();
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    buzz();
    setOrder(next);
  };
  return (
    <Sheet open={open} onClose={onClose} label="Ordenar como mi súper">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-extrabold tracking-tight">Ordenar como mi súper</h2>
        <span className="text-muted">Poné las secciones en el orden en que recorrés el supermercado.</span>
      </div>
      <ol className="flex flex-col gap-2">
        {order.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 rounded-[18px] border border-ink/5 bg-white/80 py-1.5 pl-3 pr-1.5">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-extrabold text-orange-800">
              {i + 1}
            </span>
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: sectionDot(s) }} />
            <span className="flex-1 text-[15px] font-bold">{s}</span>
            <button
              type="button"
              aria-label={`Subir ${s}`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
              className="flex size-11 items-center justify-center rounded-full disabled:opacity-25"
            >
              <ChevronUpIcon className="size-[18px]" />
            </button>
            <button
              type="button"
              aria-label={`Bajar ${s}`}
              disabled={i === order.length - 1}
              onClick={() => move(i, 1)}
              className="flex size-11 items-center justify-center rounded-full disabled:opacity-25"
            >
              <ChevronDownIcon className="size-[18px]" />
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await saveStoreOrder({ sections: order });
              toast("Recorrido guardado");
              onClose();
            } catch {
              toast("No se pudo guardar.", "error");
            }
          })
        }
        className="h-[52px] rounded-full bg-ink text-sm font-bold text-white"
      >
        Listo
      </button>
    </Sheet>
  );
}
