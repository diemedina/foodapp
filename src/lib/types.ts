export type MealId = "desayuno" | "almuerzo" | "merienda" | "cena";

export type RecipeIngredient = {
  name: string;
  section: string;
  qty: number | null;
  unit: string | null;
};

export type Recipe = {
  id: number;
  name: string;
  meals: MealId[];
  ings: RecipeIngredient[];
};

export type Slot = { recipeId: number; leftover: boolean };

/** Plan de una semana. La clave es `${día}-${comida}`, por ejemplo `0-almuerzo`. */
export type PlanMap = Record<string, Slot>;

/** Para cada receta, las semanas (lunes, YYYY-MM-DD) en que se eligió, de la más nueva a la más vieja. */
export type Usage = Record<number, string[]>;

export type HouseholdItem = { id: number; name: string; category: string; checked: boolean };

export type Template = { id: number; name: string; plan: PlanMap };
