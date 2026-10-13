"use client";

import Link from "next/link";
import { useActionState, useId, useLayoutEffect, useRef, useState } from "react";
import { CheckIcon, ChevronLeftIcon } from "@/components/icons";
import { MEALS } from "@/lib/meals";
import type { MealId } from "@/lib/types";
import { saveRecipe, type RecipeFormState } from "@/server/actions";

export function RecipeForm({
  initial,
}: {
  initial?: { id: number; name: string; meals: MealId[]; ingredients: string };
}) {
  const [state, action, pending] = useActionState<RecipeFormState, FormData>(saveRecipe, {});
  const [meals, setMeals] = useState<MealId[]>(initial?.meals ?? ["almuerzo", "cena"]);
  const editing = Boolean(initial);
  const ids = { name: useId(), ingredients: useId() };
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  // Next conserva la pantalla anterior oculta (Activity). Después de guardar, al irse de la
  // pantalla se limpia el formulario para que "Nueva receta" no muestre la receta anterior.
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => {
      if (submitted.current && !editing) {
        submitted.current = false;
        form?.reset();
        setMeals(["almuerzo", "cena"]);
      }
    };
  }, [editing]);

  return (
    <form ref={formRef} action={action} onSubmit={() => (submitted.current = true)} className="flex flex-col gap-3.5">
      <Link
        href={initial ? `/recetas/${initial.id}` : "/recetas"}
        className="pressable flex h-11 items-center gap-1 self-start rounded-full pl-1 pr-3 text-sm font-bold"
      >
        <ChevronLeftIcon className="size-5" />
        {editing ? "Volver" : "Recetas"}
      </Link>
      <h1 className="px-1 text-[28px] font-extrabold tracking-tight">{editing ? "Editar receta" : "Nueva receta"}</h1>
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.name} className="text-[13px] font-semibold text-[#4A4038]">
          Nombre
        </label>
        <input
          id={ids.name}
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="Ej: Guiso de lentejas"
          className="h-[52px] rounded-[18px] border border-ink/10 bg-white/80 px-[18px] text-[15px]"
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[13px] font-semibold text-[#4A4038]">
          ¿Para qué comidas sirve? <span className="font-medium text-muted">Podés elegir varias</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {MEALS.map((m) => {
            const on = meals.includes(m.id);
            return (
              <label
                key={m.id}
                className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-2xl text-sm font-bold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3"
                style={{
                  background: on ? m.bg : "rgba(255,255,255,0.7)",
                  color: on ? m.fg : "#1A1A1A",
                  border: on ? `1px solid ${m.fg}` : "1px solid rgba(26,26,26,0.08)",
                }}
              >
                <input
                  type="checkbox"
                  name="meals"
                  value={m.id}
                  checked={on}
                  onChange={() => setMeals((cur) => (on ? cur.filter((x) => x !== m.id) : [...cur, m.id]))}
                  className="sr-only"
                />
                {on && <CheckIcon className="animate-pop size-3.5" />}
                {m.name}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.ingredients} className="text-[13px] font-semibold text-[#4A4038]">
          Ingredientes, uno por línea <span className="font-medium text-muted">· la cantidad es opcional</span>
        </label>
        <textarea
          id={ids.ingredients}
          name="ingredients"
          rows={7}
          defaultValue={initial?.ingredients}
          placeholder={"300 g Lentejas\n1 Cebolla\n2 u Zanahoria\nSal"}
          className="resize-none rounded-[18px] border border-ink/10 bg-white/80 px-[18px] py-3.5 text-[15px]"
        />
        <span className="px-1 text-xs text-muted">
          Unidades: g, kg, ml, l, u, cda, cdta, taza, atado, lata, paquete, diente. Las cantidades son para 2 personas.
        </span>
      </div>

      {state.error && (
        <p role="alert" className="text-[13px] font-semibold text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-[52px] rounded-full bg-ink text-sm font-bold text-white shadow-lift disabled:opacity-60"
      >
        {pending ? "Guardando…" : editing ? "Guardar cambios" : "Guardar receta"}
      </button>
    </form>
  );
}
