"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import {
  householdItems,
  ingredients,
  pantryItems,
  planSlots,
  planTemplates,
  recipeIngredients,
  recipes,
  shoppingChecks,
  storeSections,
  templateSlots,
  weekPlans,
} from "@/db/schema";
import { dow, isISODate } from "@/lib/dates";
import { MEAL_IDS, parseSlotKey, sortMeals } from "@/lib/meals";
import { autofillPlan } from "@/lib/planning";
import { DEFAULT_SECTIONS, HOUSEHOLD_CATEGORIES } from "@/lib/sections";
import type { MealId } from "@/lib/types";
import { capitalize, normalizeKey, parseIngredientLine } from "@/lib/units";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, assertAccess, expectedToken, tokenForCode } from "./auth";
import { findSlot, getPlan, getRecipes, getUsage, getWeekPlanId } from "./queries";

// ---------- Validación ----------

const weekStartSchema = z
  .string()
  .refine((v) => isISODate(v) && dow(v) === 0, "La semana debe empezar un lunes (YYYY-MM-DD).");
const daySchema = z.number().int().min(0).max(6);
const mealSchema = z.enum(MEAL_IDS as [MealId, ...MealId[]]);
const idSchema = z.number().int().positive();

async function ensureWeekPlan(weekStart: string): Promise<number> {
  const db = getDb();
  const [created] = await db
    .insert(weekPlans)
    .values({ weekStart })
    .onConflictDoNothing()
    .returning({ id: weekPlans.id });
  if (created) return created.id;
  const id = await getWeekPlanId(weekStart);
  if (!id) throw new Error("No se pudo crear la semana.");
  return id;
}

// ---------- Acceso ----------

export type AccessState = { error?: string };

export async function enterAccess(_prev: AccessState, formData: FormData): Promise<AccessState> {
  const code = String(formData.get("code") ?? "");
  const expected = expectedToken();
  if (expected && tokenForCode(code) !== expected) {
    return { error: "Ese código no es correcto." };
  }
  const store = await cookies();
  store.set(ACCESS_COOKIE, expected ?? "open", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_MAX_AGE,
    path: "/",
  });
  redirect("/");
}

// ---------- Planificación ----------

export async function setSlot(input: {
  weekStart: string;
  day: number;
  meal: MealId;
  recipeId: number;
  leftover?: boolean;
}) {
  await assertAccess();
  const data = z
    .object({ weekStart: weekStartSchema, day: daySchema, meal: mealSchema, recipeId: idSchema, leftover: z.boolean().optional() })
    .parse(input);
  const db = getDb();
  const weekPlanId = await ensureWeekPlan(data.weekStart);
  await db
    .insert(planSlots)
    .values({ weekPlanId, day: data.day, meal: data.meal, recipeId: data.recipeId, isLeftover: data.leftover ?? false })
    .onConflictDoUpdate({
      target: [planSlots.weekPlanId, planSlots.day, planSlots.meal],
      set: { recipeId: data.recipeId, isLeftover: data.leftover ?? false },
    });
  refresh();
}

export async function clearSlot(input: { weekStart: string; day: number; meal: MealId }) {
  await assertAccess();
  const data = z.object({ weekStart: weekStartSchema, day: daySchema, meal: mealSchema }).parse(input);
  const weekPlanId = await getWeekPlanId(data.weekStart);
  if (!weekPlanId) return;
  await getDb()
    .delete(planSlots)
    .where(and(eq(planSlots.weekPlanId, weekPlanId), eq(planSlots.day, data.day), eq(planSlots.meal, data.meal)));
  refresh();
}

/** Mueve una comida a otro día; si ese día ya tiene esa comida, se intercambian. */
export async function moveSlot(input: { weekStart: string; day: number; meal: MealId; toDay: number }) {
  await assertAccess();
  const data = z
    .object({ weekStart: weekStartSchema, day: daySchema, meal: mealSchema, toDay: daySchema })
    .parse(input);
  if (data.day === data.toDay) return { swapped: false };
  const db = getDb();
  const weekPlanId = await getWeekPlanId(data.weekStart);
  if (!weekPlanId) return { swapped: false };
  const a = await findSlot(weekPlanId, data.day, data.meal);
  if (!a) return { swapped: false };
  const b = await findSlot(weekPlanId, data.toDay, data.meal);
  await db.delete(planSlots).where(inArray(planSlots.id, b ? [a.id, b.id] : [a.id]));
  const rows = [{ weekPlanId, day: data.toDay, meal: data.meal, recipeId: a.recipeId, isLeftover: a.isLeftover }];
  if (b) rows.push({ weekPlanId, day: data.day, meal: data.meal, recipeId: b.recipeId, isLeftover: b.isLeftover });
  await db.insert(planSlots).values(rows);
  refresh();
  return { swapped: Boolean(b) };
}

export async function autofillWeek(input: { weekStart: string }) {
  await assertAccess();
  const { weekStart } = z.object({ weekStart: weekStartSchema }).parse(input);
  const [plan, recipeList, usage] = await Promise.all([getPlan(weekStart), getRecipes(), getUsage()]);
  const added = autofillPlan({ plan, recipes: recipeList, usage, weekStart });
  if (added.length) {
    const weekPlanId = await ensureWeekPlan(weekStart);
    await getDb()
      .insert(planSlots)
      .values(added.map((a) => ({ weekPlanId, day: a.day, meal: a.meal, recipeId: a.recipeId, isLeftover: false })))
      .onConflictDoNothing();
  }
  refresh();
  return { added: added.length };
}

export async function clearWeek(input: { weekStart: string }) {
  await assertAccess();
  const { weekStart } = z.object({ weekStart: weekStartSchema }).parse(input);
  const weekPlanId = await getWeekPlanId(weekStart);
  if (weekPlanId) await getDb().delete(planSlots).where(eq(planSlots.weekPlanId, weekPlanId));
  refresh();
}

async function replaceWeek(weekStart: string, slots: { day: number; meal: string; recipeId: number; isLeftover: boolean }[]) {
  const db = getDb();
  const weekPlanId = await ensureWeekPlan(weekStart);
  await db.delete(planSlots).where(eq(planSlots.weekPlanId, weekPlanId));
  if (slots.length) await db.insert(planSlots).values(slots.map((s) => ({ ...s, weekPlanId })));
}

export async function copyWeek(input: { fromWeekStart: string; toWeekStart: string }) {
  await assertAccess();
  const data = z.object({ fromWeekStart: weekStartSchema, toWeekStart: weekStartSchema }).parse(input);
  const plan = await getPlan(data.fromWeekStart);
  await replaceWeek(
    data.toWeekStart,
    Object.entries(plan).map(([key, s]) => ({ ...parseSlotKey(key), recipeId: s.recipeId, isLeftover: s.leftover })),
  );
  refresh();
}

// ---------- Planes favoritos ----------

export async function saveTemplate(input: { name: string; weekStart: string }) {
  await assertAccess();
  const data = z.object({ name: z.string().trim().min(1, "Poné un nombre.").max(60), weekStart: weekStartSchema }).parse(input);
  const plan = await getPlan(data.weekStart);
  const entries = Object.entries(plan);
  if (!entries.length) throw new Error("Esta semana está vacía, planificá algo primero.");
  const db = getDb();
  const [tpl] = await db.insert(planTemplates).values({ name: data.name }).returning({ id: planTemplates.id });
  await db.insert(templateSlots).values(
    entries.map(([key, s]) => ({ templateId: tpl.id, ...parseSlotKey(key), recipeId: s.recipeId, isLeftover: s.leftover })),
  );
  refresh();
}

export async function applyTemplate(input: { templateId: number; weekStart: string }) {
  await assertAccess();
  const data = z.object({ templateId: idSchema, weekStart: weekStartSchema }).parse(input);
  const slots = await getDb().select().from(templateSlots).where(eq(templateSlots.templateId, data.templateId));
  await replaceWeek(
    data.weekStart,
    slots.map((s) => ({ day: s.day, meal: s.meal, recipeId: s.recipeId, isLeftover: s.isLeftover })),
  );
  refresh();
}

export async function deleteTemplate(input: { templateId: number }) {
  await assertAccess();
  const { templateId } = z.object({ templateId: idSchema }).parse(input);
  await getDb().delete(planTemplates).where(eq(planTemplates.id, templateId));
  refresh();
}

// ---------- Recetas ----------

export type RecipeFormState = { error?: string };

const recipeFormSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "Poné un nombre para la receta.").max(120),
  meals: z.array(mealSchema).min(1, "Elegí al menos una comida."),
  ingredients: z.string().max(5000),
});

export async function saveRecipe(_prev: RecipeFormState, formData: FormData): Promise<RecipeFormState> {
  await assertAccess();
  const parsed = recipeFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    meals: formData.getAll("meals"),
    ingredients: formData.get("ingredients") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  const { id, name, meals } = parsed.data;
  const lines = parsed.data.ingredients
    .split("\n")
    .map(parseIngredientLine)
    .filter((l): l is NonNullable<typeof l> => l !== null);
  if (!lines.length) return { error: "Agregá al menos un ingrediente." };

  const db = getDb();
  // Asegura que cada ingrediente exista en el catálogo (sección "Otros" si es nuevo).
  const keys = [...new Set(lines.map((l) => normalizeKey(l.name)))];
  await db
    .insert(ingredients)
    .values(
      keys.map((key) => {
        const line = lines.find((l) => normalizeKey(l.name) === key)!;
        return { key, name: capitalize(line.name), defaultUnit: line.unit, section: "Otros" };
      }),
    )
    .onConflictDoNothing();
  const catalog = await db.select().from(ingredients).where(inArray(ingredients.key, keys));
  const byKey = new Map(catalog.map((c) => [c.key, c]));

  let recipeId = id;
  if (recipeId) {
    await db
      .update(recipes)
      .set({ name, meals: sortMeals(meals), updatedAt: sql`now()` })
      .where(eq(recipes.id, recipeId));
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  } else {
    const [row] = await db.insert(recipes).values({ name, meals: sortMeals(meals) }).returning({ id: recipes.id });
    recipeId = row.id;
  }
  await db.insert(recipeIngredients).values(
    lines.map((l, position) => {
      const ing = byKey.get(normalizeKey(l.name))!;
      // Si la línea tiene número pero no unidad, usa la unidad habitual del ingrediente.
      const unit = l.qty == null ? null : (l.unit ?? ing.defaultUnit ?? "u");
      return { recipeId: recipeId!, ingredientId: ing.id, qty: l.qty, unit, position };
    }),
  );
  redirect(`/recetas/${recipeId}?guardada=${id ? "editada" : "nueva"}`);
}

export async function deleteRecipe(input: { id: number }) {
  await assertAccess();
  const { id } = z.object({ id: idSchema }).parse(input);
  await getDb().delete(recipes).where(eq(recipes.id, id));
  redirect("/recetas?eliminada=1");
}

// ---------- Compras ----------

export async function setChecked(input: { weekStart: string; itemKey: string; checked: boolean }) {
  await assertAccess();
  const data = z
    .object({ weekStart: weekStartSchema, itemKey: z.string().min(1).max(200), checked: z.boolean() })
    .parse(input);
  const db = getDb();
  const weekPlanId = await ensureWeekPlan(data.weekStart);
  if (data.checked) {
    await db.insert(shoppingChecks).values({ weekPlanId, itemKey: data.itemKey }).onConflictDoNothing();
  } else {
    await db
      .delete(shoppingChecks)
      .where(and(eq(shoppingChecks.weekPlanId, weekPlanId), eq(shoppingChecks.itemKey, data.itemKey)));
  }
  refresh();
}

export async function uncheckAll(input: { weekStart: string }) {
  await assertAccess();
  const { weekStart } = z.object({ weekStart: weekStartSchema }).parse(input);
  const db = getDb();
  const weekPlanId = await getWeekPlanId(weekStart);
  if (weekPlanId) await db.delete(shoppingChecks).where(eq(shoppingChecks.weekPlanId, weekPlanId));
  await db.update(householdItems).set({ checked: false });
  refresh();
}

export async function setAtHome(input: { name: string; atHome: boolean }) {
  await assertAccess();
  const data = z.object({ name: z.string().trim().min(1).max(120), atHome: z.boolean() }).parse(input);
  const db = getDb();
  const [ing] = await db.select().from(ingredients).where(eq(ingredients.key, normalizeKey(data.name)));
  if (!ing) return;
  if (data.atHome) await db.insert(pantryItems).values({ ingredientId: ing.id }).onConflictDoNothing();
  else await db.delete(pantryItems).where(eq(pantryItems.ingredientId, ing.id));
  refresh();
}

const categorySchema = z.enum(HOUSEHOLD_CATEGORIES.map((c) => c.id) as [string, ...string[]]);

export async function addHouseholdItem(input: { name: string; category: string }) {
  await assertAccess();
  const data = z.object({ name: z.string().trim().min(1, "Escribí un producto.").max(80), category: categorySchema }).parse(input);
  const db = getDb();
  const existing = await db.select({ id: householdItems.id, name: householdItems.name }).from(householdItems);
  if (existing.some((e) => normalizeKey(e.name) === normalizeKey(data.name))) return { added: false };
  await db.insert(householdItems).values({ name: capitalize(data.name), category: data.category });
  refresh();
  return { added: true };
}

export async function setHouseholdChecked(input: { id: number; checked: boolean }) {
  await assertAccess();
  const data = z.object({ id: idSchema, checked: z.boolean() }).parse(input);
  await getDb().update(householdItems).set({ checked: data.checked }).where(eq(householdItems.id, data.id));
  refresh();
}

export async function removeHouseholdItem(input: { id: number }) {
  await assertAccess();
  const { id } = z.object({ id: idSchema }).parse(input);
  await getDb().delete(householdItems).where(eq(householdItems.id, id));
  refresh();
}

export async function clearBoughtHousehold() {
  await assertAccess();
  await getDb().delete(householdItems).where(eq(householdItems.checked, true));
  refresh();
}

export async function saveStoreOrder(input: { sections: string[] }) {
  await assertAccess();
  const { sections } = z.object({ sections: z.array(z.string().min(1).max(60)).min(1).max(30) }).parse(input);
  const db = getDb();
  const all = [...sections, ...DEFAULT_SECTIONS.filter((s) => !sections.includes(s))];
  await db.delete(storeSections);
  await db.insert(storeSections).values(all.map((section, position) => ({ section, position })));
  refresh();
}
