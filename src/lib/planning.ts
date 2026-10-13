import { addDays, weeksBetween } from "./dates";
import { MEAL_IDS, parseSlotKey, slotAt, slotIndex, slotKey, slotLabel } from "./meals";
import type { MealId, PlanMap, Recipe, Usage } from "./types";

/** Semanas desde la última vez que se eligió la receta antes de `weekStart` (null = nunca). */
export function weeksSinceLastUse(usage: Usage, recipeId: number, weekStart: string): number | null {
  const weeks = usage[recipeId] ?? [];
  const last = weeks.find((w) => w < weekStart);
  return last ? weeksBetween(last, weekStart) : null;
}

export type LastUseBadge = { text: string; tone: "recent" | "week" | "old" };

export function lastUseBadge(opts: {
  usage: Usage;
  recipeId: number;
  weekStart: string;
  currentMonday: string;
  plan: PlanMap;
  exceptKey: string;
}): LastUseBadge {
  const { usage, recipeId, weekStart, currentMonday, plan, exceptKey } = opts;
  const same = Object.entries(plan).filter(
    ([k, s]) => k !== exceptKey && s.recipeId === recipeId && !s.leftover,
  ).length;
  if (same) return { text: `Ya está en esa semana${same > 1 ? ` ×${same}` : ""}`, tone: "recent" };
  const weeks = usage[recipeId] ?? [];
  const last = weeks.find((w) => w < weekStart);
  if (!last) return { text: "Nunca la elegiste", tone: "old" };
  if (last === currentMonday) return { text: "La elegiste esta semana", tone: "recent" };
  const ago = weeksBetween(last, currentMonday);
  if (ago <= 1) return { text: "Hace 1 semana", tone: "week" };
  return { text: `Hace ${ago} semanas`, tone: "old" };
}

/** Recetas para una comida, ordenadas de la más recomendable a la menos. */
export function rankRecipesForSlot(opts: {
  recipes: Recipe[];
  meal: MealId;
  plan: PlanMap;
  exceptKey: string;
  usage: Usage;
  weekStart: string;
}): { recipe: Recipe; suggested: boolean }[] {
  const { recipes, meal, plan, exceptKey, usage, weekStart } = opts;
  const scored = recipes
    .filter((r) => r.meals.includes(meal))
    .map((r, i) => {
      const same = Object.entries(plan).filter(([k, s]) => k !== exceptKey && s.recipeId === r.id).length;
      const ago = Math.min(weeksSinceLastUse(usage, r.id, weekStart) ?? 20, 20);
      return { recipe: r, same, score: same * 100 - ago + i * 0.01 };
    })
    .sort((a, b) => a.score - b.score);
  return scored.map((s, i) => ({ recipe: s.recipe, suggested: i === 0 && s.same === 0 && scored.length > 1 }));
}

/**
 * Completa las comidas vacías priorizando lo que hace más semanas no se come,
 * sin repetir en la semana ni dos días seguidos.
 */
export function autofillPlan(opts: { plan: PlanMap; recipes: Recipe[]; usage: Usage; weekStart: string }) {
  const { plan, recipes, usage, weekStart } = opts;
  const next: PlanMap = { ...plan };
  const added: { day: number; meal: MealId; recipeId: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (const meal of MEAL_IDS) {
      const key = slotKey(day, meal);
      if (next[key]) continue;
      const pool = recipes.filter((r) => r.meals.includes(meal));
      if (!pool.length) continue;
      let best = pool[0];
      let bestScore = Infinity;
      pool.forEach((r, i) => {
        const inWeek = Object.values(next).filter((s) => s.recipeId === r.id).length;
        const yesterday = next[slotKey(day - 1, meal)]?.recipeId === r.id ? 50 : 0;
        const ago = Math.min(weeksSinceLastUse(usage, r.id, weekStart) ?? 20, 20);
        const score = inWeek * 100 + yesterday - ago + ((i + day) % pool.length) * 0.01;
        if (score < bestScore) {
          bestScore = score;
          best = r;
        }
      });
      next[key] = { recipeId: best.id, leftover: false };
      added.push({ day, meal, recipeId: best.id });
    }
  }
  return added;
}

/** Comidas recientes (almuerzo o cena) que se pueden usar como sobras en este casillero. */
export function leftoverCandidates(plan: PlanMap, day: number, meal: MealId, recipesById: Map<number, Recipe>) {
  if (meal !== "almuerzo" && meal !== "cena") return [];
  const idx = slotIndex(day, meal);
  const seen = new Set<number>();
  const out: { recipe: Recipe; from: string }[] = [];
  for (let j = idx - 1; j >= Math.max(0, idx - 5) && out.length < 2; j--) {
    const at = slotAt(j);
    if (at.meal !== "almuerzo" && at.meal !== "cena") continue;
    const slot = plan[slotKey(at.day, at.meal)];
    if (!slot || slot.leftover || seen.has(slot.recipeId)) continue;
    const recipe = recipesById.get(slot.recipeId);
    if (!recipe) continue;
    seen.add(slot.recipeId);
    out.push({ recipe, from: slotLabel(at.day, at.meal) });
  }
  return out;
}

/**
 * Para mostrar "Sobras de..." y "Cociná doble: rinde para...".
 * Devuelve, por clave de casillero, de dónde vienen las sobras y para cuándo rinde lo que se cocina.
 */
export function leftoverLinks(plan: PlanMap) {
  const cookFor: Record<string, string> = {};
  const from: Record<string, string> = {};
  for (const [key, slot] of Object.entries(plan)) {
    if (!slot.leftover) continue;
    const { day, meal } = parseSlotKey(key);
    const idx = slotIndex(day, meal);
    for (let j = idx - 1; j >= 0; j--) {
      const at = slotAt(j);
      const other = plan[slotKey(at.day, at.meal)];
      if (other && !other.leftover && other.recipeId === slot.recipeId) {
        cookFor[slotKey(at.day, at.meal)] = slotLabel(day, meal);
        from[key] = slotLabel(at.day, at.meal);
        break;
      }
    }
  }
  return { cookFor, from };
}

export function plannedCount(plan: PlanMap): number {
  return Object.keys(plan).length;
}

export function dateOfDay(monday: string, day: number): string {
  return addDays(monday, day);
}
