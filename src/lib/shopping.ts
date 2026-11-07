import { sectionDot, sectionFromCategory } from "./sections";
import type { HouseholdItem, PlanMap, Recipe } from "./types";
import { fmtAmount, normalizeKey } from "./units";

export type ShoppingItem = {
  key: string;
  name: string;
  amount: string;
  recipes: string[];
  recipeCount: number;
  manualId?: number;
  checked: boolean;
};

export type ShoppingGroup = { section: string; dot: string; items: ShoppingItem[] };

export type ShoppingList = {
  groups: ShoppingGroup[];
  /** Ingredientes de la semana que ya hay en casa (no se compran). */
  atHome: { key: string; name: string; amount: string }[];
  total: number;
  pending: number;
};

type Acc = {
  key: string;
  name: string;
  nameKey: string;
  section: string;
  unit: string | null;
  qty: number;
  unknown: boolean;
  recipes: string[];
};

/**
 * Arma la lista de compras de una semana: suma los ingredientes de todas las comidas
 * planificadas (las sobras cuentan, porque se cocina doble), agrupa por sección según
 * el orden del súper y separa lo que ya hay en casa.
 */
export function buildShoppingList(input: {
  plan: PlanMap;
  recipesById: Map<number, Recipe>;
  pantry: Set<string>;
  sectionOrder: string[];
  checks: Set<string>;
  manualItems?: HouseholdItem[];
}): ShoppingList {
  const { plan, recipesById, pantry, sectionOrder, checks } = input;
  const acc = new Map<string, Acc>();
  const recipeIdsByIngredient = new Map<string, Set<number>>();
  const withoutQty: { ing: Recipe["ings"][number]; recipe: Recipe }[] = [];

  for (const slot of Object.values(plan)) {
    const recipe = recipesById.get(slot.recipeId);
    if (!recipe) continue;
    for (const ing of recipe.ings) {
      const nameKey = normalizeKey(ing.name);
      const recipeIds = recipeIdsByIngredient.get(nameKey) ?? new Set<number>();
      recipeIds.add(recipe.id);
      recipeIdsByIngredient.set(nameKey, recipeIds);
      if (ing.qty == null || !ing.unit) {
        withoutQty.push({ ing, recipe });
        continue;
      }
      const key = `${nameKey}|${ing.unit}`;
      let a = acc.get(key);
      if (!a) {
        a = { key, name: ing.name, nameKey, section: ing.section, unit: ing.unit, qty: 0, unknown: false, recipes: [] };
        acc.set(key, a);
      }
      a.qty += ing.qty;
      if (!a.recipes.includes(recipe.name)) a.recipes.push(recipe.name);
    }
  }

  // Los ingredientes sin cantidad se suman al mismo producto si ya existe con cantidad.
  for (const { ing, recipe } of withoutQty) {
    const nameKey = normalizeKey(ing.name);
    let target = [...acc.values()].find((a) => a.nameKey === nameKey);
    if (!target) {
      const key = `${nameKey}|?`;
      target = { key, name: ing.name, nameKey, section: ing.section, unit: null, qty: 0, unknown: false, recipes: [] };
      acc.set(key, target);
    }
    target.unknown = true;
    if (!target.recipes.includes(recipe.name)) target.recipes.push(recipe.name);
  }

  const amountOf = (a: Acc) => {
    const base = a.unit && a.qty > 0 ? fmtAmount(a.qty, a.unit) : "";
    return base && a.unknown ? `${base} +` : base;
  };

  const all = [...acc.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const atHome = all.filter((a) => pantry.has(a.nameKey)).map((a) => ({ key: a.key, name: a.name, amount: amountOf(a) }));
  const toBuy = all.filter((a) => !pantry.has(a.nameKey));

  const manualItems = input.manualItems ?? [];
  const manualBySection = new Map<string, HouseholdItem[]>();
  for (const item of manualItems) {
    const section = sectionFromCategory(item.category);
    const items = manualBySection.get(section) ?? [];
    items.push(item);
    manualBySection.set(section, items);
  }
  const sections = new Set([...sectionOrder, ...manualBySection.keys(), ...toBuy.map((item) => item.section)]);

  let pending = 0;
  const groups: ShoppingGroup[] = [];
  for (const section of sections) {
    const items: ShoppingItem[] = toBuy
      .filter((a) => a.section === section)
      .map((a) => {
        const checked = checks.has(a.key);
        if (!checked) pending++;
        return {
          key: a.key,
          name: a.name,
          amount: amountOf(a),
          recipes: a.recipes,
          recipeCount: recipeIdsByIngredient.get(a.nameKey)?.size ?? 0,
          checked,
        };
      });
    for (const item of manualBySection.get(section) ?? []) {
      if (!item.checked) pending++;
      items.push({
        key: `manual:${item.id}`,
        manualId: item.id,
        name: item.name,
        amount: "",
        recipes: [],
        recipeCount: 0,
        checked: item.checked,
      });
    }
    if (items.length) groups.push({ section, dot: sectionDot(section), items });
  }

  return { groups, atHome, total: toBuy.length + manualItems.length, pending };
}
