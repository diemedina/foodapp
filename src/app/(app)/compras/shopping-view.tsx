"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle } from "@/components/check-circle";
import { BagIcon, BookIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon, DotsIcon, HomeIcon, PlusIcon, SortIcon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { buzz, useToast } from "@/components/toast";
import { WeekTabs } from "@/components/week-tabs";
import type { AppData } from "@/lib/app-data";
import { useAppStore, writeAppData } from "@/lib/app-store";
import { capitalize, normalizeKey } from "@/lib/units";
import { HOUSEHOLD_SECTION, householdPurchaseState, sectionCategory, sectionDot } from "@/lib/sections";
import type { ShoppingList } from "@/lib/shopping";
import type { HouseholdItem } from "@/lib/types";
import {
  addHouseholdItem,
  removeHouseholdItem,
  saveStoreOrder,
  setAtHome,
  setIngredientSection,
  setChecked,
  setHouseholdAtHome,
  setHouseholdChecked,
  uncheckAll,
} from "@/server/actions";

type ShoppingData = AppData["shopping"];

function shoppingPatch(update: (shopping: ShoppingData) => ShoppingData) {
  return (data: AppData): AppData => ({ ...data, shopping: update(data.shopping) });
}

function toggle(items: string[], key: string, on: boolean) {
  return on ? [...new Set([...items, key])] : items.filter((item) => item !== key);
}

let nextTemporaryId = -1;

export function ShoppingView(props: {
  offset: number;
  weekStart: string;
  ranges: string[];
  list: ShoppingList;
  sectionOrder: string[];
}) {
  const { weekStart } = props;
  const toast = useToast();
  const [showOrder, setShowOrder] = useState(false);
  const [editing, setEditing] = useState<{ name: string; section: string } | null>(null);
  const sectionInputId = useId();
  const sectionSelectId = useId();
  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");

  const state = props;
  const markAtHome = (name: string, atHome: boolean) =>
    optimistic(
      (shopping) => ({ ...shopping, pantry: toggle(shopping.pantry, normalizeKey(name), atHome) }),
      () => setAtHome({ name, atHome }),
      atHome ? `${name}: ya lo tenés en casa` : `${name} volvió a la lista`,
    );

  const markHouseholdAtHome = (id: number, name: string, atHome: boolean) =>
    optimistic(
      (shopping) => ({
        ...shopping,
        household: shopping.household.map((item) => item.id === id ? { ...item, ...householdPurchaseState(atHome) } : item),
      }),
      () => setHouseholdAtHome({ id, atHome }),
      atHome ? `${name}: ya lo tenés en casa` : `${name} volvió a la lista`,
    );

  const items = state.list.groups.flatMap((g) => g.items);
  const { total, pending } = state.list;
  const done = total - pending;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function optimistic(update: (shopping: ShoppingData) => ShoppingData, save: () => Promise<unknown>, message?: string) {
    buzz();
    try {
      await writeAppData(save, shoppingPatch(update));
      if (message) toast(message);
    } catch {
      toast("No se pudo guardar. Se revirtió el cambio.", "error");
    }
  }

  async function plain(save: () => Promise<unknown>, message: string) {
    try {
      await writeAppData(save);
      toast(message);
    } catch (error) {
      toast(error instanceof Error ? error.message : "No se pudo guardar.", "error");
    }
  }

  async function addProduct(value: string, selectedCategory: string) {
    value = value.trim();
    if (!value || value.length > 80) return false;
    const key = normalizeKey(value);
    const products = useAppStore.getState().data?.shopping.household ?? [];
    const ingredientExists = items.some((item) => normalizeKey(item.name) === key)
      || state.list.atHome.some((item) => normalizeKey(item.name) === key);
    if (!key) return false;
    if (ingredientExists || products.some((item) => normalizeKey(item.name) === key)) {
      toast(`${value} ya estaba en la lista`);
      return true;
    }

    const product = { id: nextTemporaryId--, name: capitalize(value), category: selectedCategory, checked: false };
    const withProduct = (item: HouseholdItem) => shoppingPatch((shopping) => (
      shopping.household.some((existing) => existing.id === item.id || normalizeKey(existing.name) === key)
        ? shopping
        : { ...shopping, household: [...shopping.household, item] }
    ));

    try {
      const result = await writeAppData(
        () => addHouseholdItem({ name: value, category: selectedCategory }),
        withProduct(product),
        (data, saved) => withProduct(saved.item)(data),
      );
      toast(result.added ? `${value} agregado a la lista` : `${value} ya estaba en la lista`);
      return true;
    } catch {
      toast("No se pudo agregar el producto.", "error");
      return false;
    }
  }

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
            onClick={() => optimistic(
              (shopping) => ({
                ...shopping,
                checks: { ...shopping.checks, [weekStart]: [] },
                household: shopping.household.map((item) => ({ ...item, checked: false })),
              }),
              () => uncheckAll({ weekStart }),
              "Lista desmarcada",
            )}
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

      <button
        type="button"
        onClick={() => setAddingSection(props.sectionOrder[0] ?? "Otros")}
        className="pressable glass flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold"
      >
        <PlusIcon className="size-[18px]" />
        Agregar producto
      </button>

      {state.list.groups.length === 0 && state.list.atHome.length === 0 && (
        <p className="glass rounded-[24px] px-5 py-6 text-center text-muted">
          Tu lista está vacía. Agregá productos o elegí recetas en Semana para sumar sus ingredientes.
        </p>
      )}

      {state.list.groups.map((g) => {
        const left = g.items.filter((i) => !i.checked).length;
        return (
          <section key={g.section} aria-label={g.section} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1.5">
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                <span className="size-2.5 rounded-full" style={{ background: g.dot }} />
                {g.section}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">{left === 0 ? "Listo" : `${left} de ${g.items.length}`}</span>
                <button
                  type="button"
                  aria-label={`Agregar producto a ${g.section}`}
                  onClick={() => setAddingSection(g.section)}
                  className="glass flex size-11 items-center justify-center rounded-full"
                >
                  <PlusIcon className="size-[18px]" />
                </button>
              </div>
            </div>
            <div className="glass rounded-[24px] px-2 py-1">
              {g.items.map((it, idx) => {
                const manualId = it.manualId;
                return (
                  <div key={it.key} className={`flex items-center ${idx ? "border-t border-ink/5" : ""}`}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={it.checked}
                      disabled={manualId !== undefined && manualId < 0}
                      onClick={() =>
                        optimistic(
                          (shopping) => ({
                            ...shopping,
                            checks: manualId === undefined ? {
                              ...shopping.checks,
                              [weekStart]: toggle(shopping.checks[weekStart] ?? [], it.key, !it.checked),
                            } : shopping.checks,
                            household: shopping.household.map((item) =>
                              item.id === manualId ? { ...item, checked: !it.checked } : item,
                            ),
                          }),
                          () => manualId === undefined
                            ? setChecked({ weekStart, itemKey: it.key, checked: !it.checked })
                            : setHouseholdChecked({ id: manualId, checked: !it.checked }),
                        )
                      }
                      className="flex min-h-[62px] min-w-0 flex-1 items-center gap-3 py-2.5 pl-2 pr-1 text-left active:scale-100"
                    >
                      <CheckCircle checked={it.checked} />
                      <span className={`flex min-w-0 flex-1 flex-col ${it.checked ? "opacity-50" : ""}`}>
                        <span className={`text-[15px] font-semibold ${it.checked ? "line-through" : ""}`}>{it.name}</span>
                        {it.recipes.length > 0 && <span className="truncate text-xs text-muted">{it.recipes.join(", ")}</span>}
                      </span>
                      <RecipeCountBadge count={it.recipeCount} checked={it.checked} />
                    </button>
                    {(manualId === undefined || g.section === HOUSEHOLD_SECTION) && (
                      <button
                        type="button"
                        aria-label={`Ya tengo ${it.name} en casa`}
                        disabled={manualId !== undefined && manualId < 0}
                        onClick={() => manualId === undefined
                          ? markAtHome(it.name, true)
                          : markHouseholdAtHome(manualId, it.name, true)}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-subtle"
                      >
                        <HomeIcon className="size-[18px]" />
                      </button>
                    )}
                    {manualId === undefined ? (
                      <button
                        type="button"
                        aria-label={`Cambiar sección de ${it.name}`}
                        onClick={() => setEditing({ name: it.name, section: g.section })}
                        className="-ml-1.5 flex size-11 shrink-0 items-center justify-center rounded-full text-subtle"
                      >
                        <DotsIcon className="size-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Quitar ${it.name}`}
                        disabled={manualId < 0}
                        onClick={() => optimistic(
                          (shopping) => ({
                            ...shopping,
                            household: shopping.household.filter((item) => item.id !== manualId),
                          }),
                          () => removeHouseholdItem({ id: manualId }),
                          `${it.name} quitado`,
                        )}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted"
                      >
                        <CloseIcon className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
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
              <div key={p.key} className={`flex min-h-[52px] items-center gap-2.5 py-1 pl-2 pr-1 ${idx ? "border-t border-green-800/10" : ""}`}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold">{p.name}</span>
                  {p.recipes.length > 0 && <span className="truncate text-xs text-muted">{p.recipes.join(", ")}</span>}
                </span>
                <RecipeCountBadge count={p.recipeCount} />
                <button
                  type="button"
                  aria-label={`Lo necesito: ${p.name}`}
                  onClick={() => p.manualId === undefined
                    ? markAtHome(p.name, false)
                    : markHouseholdAtHome(p.manualId, p.name, false)}
                  className="h-10 rounded-full border border-green-800/25 bg-white/80 px-3 text-xs font-extrabold text-green-800"
                >
                  Lo necesito
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Sheet open={addingSection !== null} onClose={() => setAddingSection(null)} label="Agregar producto">
        <h2 className="text-[22px] font-extrabold tracking-tight">Agregar producto</h2>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const value = sectionName.trim();
            const section = addingSection;
            if (!value || !section) return;
            setSectionName("");
            setAddingSection(null);
            void addProduct(value, sectionCategory(section)).then((saved) => {
              if (!saved) {
                setSectionName((current) => current || value);
                setAddingSection((current) => current ?? section);
              }
            });
          }}
        >
          <label htmlFor={sectionInputId} className="text-[13px] font-semibold">Producto</label>
          <input
            id={sectionInputId}
            required
            autoFocus
            maxLength={80}
            value={sectionName}
            onChange={(event) => setSectionName(event.target.value)}
            placeholder="Ej. Manzanas"
            className="h-12 rounded-[18px] border border-ink/10 bg-white/85 px-4"
          />
          <label htmlFor={sectionSelectId} className="text-[13px] font-semibold">Categoría</label>
          <select
            id={sectionSelectId}
            value={addingSection ?? ""}
            onChange={(event) => setAddingSection(event.target.value)}
            className="h-12 rounded-[18px] border border-ink/10 bg-white/85 px-4"
          >
            {props.sectionOrder.map((section) => <option key={section} value={section}>{section}</option>)}
          </select>
          <button type="submit" className="h-[52px] rounded-full bg-ink text-sm font-bold text-white">
            Agregar
          </button>
        </form>
      </Sheet>

      <OrderSheet
        key={JSON.stringify(props.sectionOrder)}
        open={showOrder}
        onClose={() => setShowOrder(false)}
        initial={props.sectionOrder}
      />
      <ItemSheet
        item={editing}
        sections={props.sectionOrder}
        onClose={() => setEditing(null)}
        onSection={(name, section) => {
          setEditing(null);
          buzz();
          plain(() => setIngredientSection({ name, section }), `${name} → ${section}`);
        }}
      />
    </>
  );
}

function RecipeCountBadge({ count, checked = false }: { count: number; checked?: boolean }) {
  if (count < 2) return null;
  return (
    <span
      aria-label={`${count} recetas`}
      className={`flex shrink-0 items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 text-[13px] font-bold ${checked ? "opacity-50" : ""}`}
    >
      <BookIcon aria-hidden className="size-4" />
      {count}
    </span>
  );
}

/** Mover un producto a otra sección del súper (se recuerda para las próximas semanas). */
function ItemSheet({
  item,
  sections,
  onClose,
  onSection,
}: {
  item: { name: string; section: string } | null;
  sections: string[];
  onClose: () => void;
  onSection: (name: string, section: string) => void;
}) {
  return (
    <Sheet open={item !== null} onClose={onClose} label={item ? `Sección de ${item.name}` : "Sección"}>
      {item && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-extrabold tracking-tight">{item.name}</h2>
            <span className="text-muted">¿En qué sección del súper lo buscás?</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => {
                const on = s === item.section;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => (on ? onClose() : onSection(item.name, s))}
                    className={`pressable flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                      on ? "bg-ink text-white" : "border border-ink/5 bg-white/80"
                    }`}
                  >
                    <span className="size-2.5 rounded-full" style={{ background: sectionDot(s) }} />
                    {s}
                  </button>
                );
              })}
            </div>
            <span className="px-1 text-xs text-muted">Se recuerda para las próximas semanas.</span>
          </div>
        </>
      )}
    </Sheet>
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
              await writeAppData(() => saveStoreOrder({ sections: order }));
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
