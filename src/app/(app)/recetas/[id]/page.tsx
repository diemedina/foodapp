import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { FlashToast } from "@/components/flash-toast";
import { CalendarIcon, ChevronLeftIcon, EditIcon, FlaskIcon, MealIcon } from "@/components/icons";
import { PageTransition } from "@/components/page-transition";
import { mondayOf, todayISO } from "@/lib/dates";
import { mealOf, mealsText } from "@/lib/meals";
import { fmtAmount } from "@/lib/units";
import { getPlan, getRecipe } from "@/server/queries";
import { DeleteRecipeButton } from "./delete-button";

export default async function RecipePage(props: PageProps<"/recetas/[id]">) {
  const { id } = await props.params;
  const search = await props.searchParams;
  const recipe = await getRecipe(Number(id));
  if (!recipe) notFound();
  const plan = await getPlan(mondayOf(todayISO()));
  const uses = Object.values(plan).filter((s) => s.recipeId === recipe.id).length;
  const m = mealOf(recipe.meals[0] ?? "almuerzo");
  const flash = search.guardada === "nueva" ? "Receta guardada" : search.guardada === "editada" ? "Cambios guardados" : null;

  return (
    <PageTransition>
      <FlashToast message={flash} />
      <Link href="/recetas" className="pressable flex h-11 items-center gap-1 self-start rounded-full pl-1 pr-3 text-sm font-bold">
        <ChevronLeftIcon className="size-5" />
        Recetas
      </Link>

      <ViewTransition name={`recipe-art-${recipe.id}`} share="morph">
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-[28px]" style={{ background: m.bg, color: m.fg }}>
          <span aria-hidden className="absolute size-[150px] rounded-full bg-white/45" />
          <MealIcon meal={m.id} className="relative size-14" strokeWidth={1.3} />
        </div>
      </ViewTransition>

      <div className="flex flex-col gap-1 px-1">
        <span className="text-[13px] font-bold" style={{ color: m.fg }}>
          {mealsText(recipe.meals)}
        </span>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">{recipe.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass flex items-center gap-2.5 rounded-[18px] px-3 py-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange-200 text-orange-800">
            <FlaskIcon className="size-[18px]" />
          </span>
          <span className="flex flex-col">
            <strong className="text-[15px]">{recipe.ings.length}</strong>
            <span className="text-xs text-muted">ingredientes</span>
          </span>
        </div>
        <div className="glass flex items-center gap-2.5 rounded-[18px] px-3 py-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#FFF1C9] text-[#7A5300]">
            <CalendarIcon className="size-[18px]" />
          </span>
          <span className="flex flex-col">
            <strong className="text-[15px]">{uses}</strong>
            <span className="text-xs text-muted">{uses === 1 ? "vez esta semana" : "veces esta semana"}</span>
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-base font-extrabold">Ingredientes</h2>
        <ul className="glass rounded-[20px] px-4 py-1">
          {recipe.ings.map((i, k) => (
            <li key={`${i.name}-${k}`} className={`flex justify-between gap-3 py-3 text-sm ${k ? "border-t border-ink/5" : ""}`}>
              <span>{i.name}</span>
              <span className="whitespace-nowrap font-bold">{fmtAmount(i.qty, i.unit)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2.5">
        <DeleteRecipeButton id={recipe.id} />
        <Link
          href={`/recetas/${recipe.id}/editar`}
          className="pressable glass flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold"
        >
          <EditIcon className="size-4" />
          Editar
        </Link>
      </div>
    </PageTransition>
  );
}
