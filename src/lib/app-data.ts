import { buildShoppingList } from "./shopping";
import type { HouseholdItem, PlanMap, Recipe, Template, Usage } from "./types";

export type AppData = {
  timeZone: string;
  weeks: [string, string];
  plans: Record<string, PlanMap>;
  recipes: Recipe[];
  usage: Usage;
  templates: Template[];
  shopping: {
    pantry: string[];
    checks: Record<string, string[]>;
    household: HouseholdItem[];
    order: string[];
  };
};

export function shoppingListFor(data: AppData, week: string) {
  return buildShoppingList({
    plan: data.plans[week],
    recipesById: new Map(data.recipes.map((recipe) => [recipe.id, recipe])),
    pantry: new Set(data.shopping.pantry),
    checks: new Set(data.shopping.checks[week]),
    sectionOrder: data.shopping.order,
    manualItems: data.shopping.household,
  });
}
