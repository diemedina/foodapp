import { and, asc, desc, eq, inArray } from "drizzle-orm";
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
import { isMealId, slotKey, sortMeals } from "@/lib/meals";
import { DEFAULT_SECTIONS } from "@/lib/sections";
import type { HouseholdItem, MealId, PlanMap, Recipe, Template, Usage } from "@/lib/types";

function toMeals(values: string[]): MealId[] {
  return sortMeals(values.filter(isMealId));
}

export async function getRecipes(): Promise<Recipe[]> {
  const db = getDb();
  const [rows, ings] = await Promise.all([
    db.select().from(recipes).orderBy(asc(recipes.name)),
    db
      .select({
        recipeId: recipeIngredients.recipeId,
        name: ingredients.name,
        section: ingredients.section,
        qty: recipeIngredients.qty,
        unit: recipeIngredients.unit,
      })
      .from(recipeIngredients)
      .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
      .orderBy(asc(recipeIngredients.recipeId), asc(recipeIngredients.position)),
  ]);
  const byRecipe = new Map<number, Recipe["ings"]>();
  for (const i of ings) {
    const list = byRecipe.get(i.recipeId) ?? [];
    list.push({ name: i.name, section: i.section, qty: i.qty, unit: i.unit });
    byRecipe.set(i.recipeId, list);
  }
  return rows.map((r) => ({ id: r.id, name: r.name, meals: toMeals(r.meals), ings: byRecipe.get(r.id) ?? [] }));
}

export async function getRecipe(id: number): Promise<Recipe | null> {
  const all = await getRecipes();
  return all.find((r) => r.id === id) ?? null;
}

export async function getPlan(weekStart: string): Promise<PlanMap> {
  const db = getDb();
  const rows = await db
    .select({ day: planSlots.day, meal: planSlots.meal, recipeId: planSlots.recipeId, leftover: planSlots.isLeftover })
    .from(planSlots)
    .innerJoin(weekPlans, eq(planSlots.weekPlanId, weekPlans.id))
    .where(eq(weekPlans.weekStart, weekStart));
  const plan: PlanMap = {};
  for (const r of rows) {
    if (isMealId(r.meal)) plan[slotKey(r.day, r.meal)] = { recipeId: r.recipeId, leftover: r.leftover };
  }
  return plan;
}

/** Semanas en que se eligió cada receta (sin contar sobras), de la más reciente a la más vieja. */
export async function getUsage(): Promise<Usage> {
  const db = getDb();
  const rows = await db
    .selectDistinct({ weekStart: weekPlans.weekStart, recipeId: planSlots.recipeId })
    .from(planSlots)
    .innerJoin(weekPlans, eq(planSlots.weekPlanId, weekPlans.id))
    .where(eq(planSlots.isLeftover, false))
    .orderBy(desc(weekPlans.weekStart));
  const usage: Usage = {};
  for (const r of rows) (usage[r.recipeId] ??= []).push(r.weekStart);
  return usage;
}

export async function getWeekPlanId(weekStart: string): Promise<number | null> {
  const db = getDb();
  const [row] = await db.select({ id: weekPlans.id }).from(weekPlans).where(eq(weekPlans.weekStart, weekStart));
  return row?.id ?? null;
}

export async function getShoppingState(weekStart: string) {
  const db = getDb();
  const planId = await getWeekPlanId(weekStart);
  const [checks, pantry, household, order] = await Promise.all([
    planId
      ? db.select({ key: shoppingChecks.itemKey }).from(shoppingChecks).where(eq(shoppingChecks.weekPlanId, planId))
      : Promise.resolve([]),
    db
      .select({ key: ingredients.key })
      .from(pantryItems)
      .innerJoin(ingredients, eq(pantryItems.ingredientId, ingredients.id)),
    db.select().from(householdItems).orderBy(asc(householdItems.createdAt)),
    getStoreOrder(),
  ]);
  return {
    checks: new Set(checks.map((c) => c.key)),
    pantry: new Set(pantry.map((p) => p.key)),
    household: household.map<HouseholdItem>((h) => ({ id: h.id, name: h.name, category: h.category, checked: h.checked })),
    order,
  };
}

export async function getStoreOrder(): Promise<string[]> {
  const db = getDb();
  const rows = await db.select().from(storeSections).orderBy(asc(storeSections.position));
  const order = rows.map((r) => r.section);
  for (const s of DEFAULT_SECTIONS) if (!order.includes(s)) order.push(s);
  return order;
}

export async function getTemplates(): Promise<Template[]> {
  const db = getDb();
  const tpls = await db.select().from(planTemplates).orderBy(desc(planTemplates.createdAt));
  if (!tpls.length) return [];
  const slots = await db
    .select()
    .from(templateSlots)
    .where(
      inArray(
        templateSlots.templateId,
        tpls.map((t) => t.id),
      ),
    );
  return tpls.map((t) => {
    const plan: PlanMap = {};
    for (const s of slots) {
      if (s.templateId === t.id && isMealId(s.meal)) {
        plan[slotKey(s.day, s.meal)] = { recipeId: s.recipeId, leftover: s.isLeftover };
      }
    }
    return { id: t.id, name: t.name, plan };
  });
}

export async function findSlot(weekPlanId: number, day: number, meal: MealId) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(planSlots)
    .where(and(eq(planSlots.weekPlanId, weekPlanId), eq(planSlots.day, day), eq(planSlots.meal, meal)));
  return row ?? null;
}
