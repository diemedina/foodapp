import { HOUSEHOLD_AT_HOME_CATEGORY, sectionDot, sectionFromCategory } from "./sections";
import type { HouseholdItem, PlanMap, Recipe } from "./types";
import { normalizeKey } from "./units";

type ShoppingProduct = {
  key: string;
  name: string;
  recipes: string[];
  recipeCount: number;
  manualId?: number;
};

export type ShoppingItem = ShoppingProduct & { checked: boolean };

export type ShoppingGroup = { section: string; dot: string; items: ShoppingItem[] };

export type ShoppingList = {
  groups: ShoppingGroup[];
  /** Ingredientes de la semana y productos manuales que ya hay en casa. */
  atHome: ShoppingProduct[];
  total: number;
  pending: number;
};

type Acc = {
  key: string;
  name: string;
  nameKey: string;
  section: string;
  recipes: string[];
};

/**
 * Agrupa los ingredientes del plan y los productos manuales según el orden del súper.
 * Conserva las claves por unidad para reconocer las marcas guardadas.
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
        a = { key, name: ing.name, nameKey, section: ing.section, recipes: [] };
        acc.set(key, a);
      }
      if (!a.recipes.includes(recipe.name)) a.recipes.push(recipe.name);
    }
  }

  // Los ingredientes sin cantidad se suman al mismo producto si ya existe con cantidad.
  for (const { ing, recipe } of withoutQty) {
    const nameKey = normalizeKey(ing.name);
    let target = [...acc.values()].find((a) => a.nameKey === nameKey);
    if (!target) {
      const key = `${nameKey}|?`;
      target = { key, name: ing.name, nameKey, section: ing.section, recipes: [] };
      acc.set(key, target);
    }
    if (!target.recipes.includes(recipe.name)) target.recipes.push(recipe.name);
  }

  const ingredientProduct = (a: Acc): ShoppingProduct => ({
    key: a.key,
    name: a.name,
    recipes: a.recipes,
    recipeCount: recipeIdsByIngredient.get(a.nameKey)?.size ?? 0,
  });

  const all = [...acc.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const atHome = all.filter((a) => pantry.has(a.nameKey)).map(ingredientProduct);
  const toBuy = all.filter((a) => !pantry.has(a.nameKey));

  const manualBySection = new Map<string, HouseholdItem[]>();
  let total = toBuy.length;
  for (const item of input.manualItems ?? []) {
    if (item.category === HOUSEHOLD_AT_HOME_CATEGORY) {
      atHome.push(manualProduct(item));
      continue;
    }
    total++;
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
        return { ...ingredientProduct(a), checked };
      });
    for (const item of manualBySection.get(section) ?? []) {
      if (!item.checked) pending++;
      items.push({ ...manualProduct(item), checked: item.checked });
    }
    if (items.length) groups.push({ section, dot: sectionDot(section), items });
  }

  return { groups, atHome, total, pending };
}

function manualProduct(item: HouseholdItem): ShoppingProduct {
  return {
    key: `manual:${item.id}`,
    manualId: item.id,
    name: item.name,
    recipes: [],
    recipeCount: 0,
  };
}
