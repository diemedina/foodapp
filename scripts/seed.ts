/**
 * Carga datos iniciales: catálogo de ingredientes, recetas de ejemplo,
 * orden del súper y dos planes favoritos. Solo corre si no hay recetas.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

import { getDb } from "../src/db";
import {
  ingredients,
  planTemplates,
  recipeIngredients,
  recipes,
  storeSections,
  templateSlots,
} from "../src/db/schema";
import { DEFAULT_SECTIONS } from "../src/lib/sections";
import type { MealId } from "../src/lib/types";
import { normalizeKey } from "../src/lib/units";

const CATALOG: [name: string, unit: string, section: string][] = [
  ["Pan", "rebanadas", "Panadería"],
  ["Palta", "u", "Verdulería"],
  ["Huevos", "u", "Lácteos y huevos"],
  ["Avena", "g", "Almacén"],
  ["Banana", "u", "Verdulería"],
  ["Leche", "ml", "Lácteos y huevos"],
  ["Yogur natural", "g", "Lácteos y huevos"],
  ["Granola", "g", "Almacén"],
  ["Frutillas", "g", "Verdulería"],
  ["Nalga para milanesa", "g", "Carnicería"],
  ["Pan rallado", "g", "Almacén"],
  ["Papa", "g", "Verdulería"],
  ["Manteca", "g", "Lácteos y huevos"],
  ["Pechuga de pollo", "g", "Carnicería"],
  ["Lechuga", "u", "Verdulería"],
  ["Tomate", "u", "Verdulería"],
  ["Zanahoria", "u", "Verdulería"],
  ["Fideos", "g", "Almacén"],
  ["Puré de tomate", "g", "Almacén"],
  ["Carne picada", "g", "Carnicería"],
  ["Cebolla", "u", "Verdulería"],
  ["Tapas de tarta", "u", "Almacén"],
  ["Acelga", "atado", "Verdulería"],
  ["Queso cremoso", "g", "Lácteos y huevos"],
  ["Yerba", "g", "Almacén"],
  ["Mermelada", "g", "Almacén"],
  ["Pollo en presas", "g", "Carnicería"],
  ["Calabaza", "g", "Verdulería"],
  ["Arroz", "g", "Almacén"],
  ["Morrón", "u", "Verdulería"],
  ["Zucchini", "u", "Verdulería"],
  ["Salsa de soja", "ml", "Almacén"],
  ["Queso rallado", "g", "Lácteos y huevos"],
  ["Aceite", "ml", "Almacén"],
  ["Manzana", "u", "Verdulería"],
  ["Sal", "g", "Almacén"],
  ["Romero", "u", "Verdulería"],
];

type SeedRecipe = { key: string; name: string; meals: MealId[]; ings: [string, number | null][] };

const RECIPES: SeedRecipe[] = [
  { key: "d1", name: "Tostadas con palta y huevo", meals: ["desayuno", "merienda"], ings: [["Pan", 4], ["Palta", 1], ["Huevos", 2]] },
  { key: "d2", name: "Avena con banana", meals: ["desayuno"], ings: [["Avena", 100], ["Banana", 2], ["Leche", 400]] },
  { key: "d3", name: "Yogur con granola y frutillas", meals: ["desayuno", "merienda"], ings: [["Yogur natural", 400], ["Granola", 80], ["Frutillas", 200]] },
  { key: "a1", name: "Milanesas con puré", meals: ["almuerzo", "cena"], ings: [["Nalga para milanesa", 400], ["Huevos", 2], ["Pan rallado", 150], ["Papa", 600], ["Leche", 100], ["Manteca", 20]] },
  { key: "a2", name: "Ensalada completa con pollo", meals: ["almuerzo", "cena"], ings: [["Pechuga de pollo", 300], ["Lechuga", 1], ["Tomate", 2], ["Zanahoria", 1], ["Aceite", 20]] },
  { key: "a3", name: "Fideos con tuco", meals: ["almuerzo", "cena"], ings: [["Fideos", 250], ["Puré de tomate", 520], ["Carne picada", 250], ["Cebolla", 1], ["Queso rallado", 40]] },
  { key: "a4", name: "Tarta de acelga", meals: ["almuerzo", "cena"], ings: [["Tapas de tarta", 2], ["Acelga", 1], ["Huevos", 3], ["Cebolla", 1], ["Queso cremoso", 150]] },
  { key: "m1", name: "Mate con tostadas", meals: ["desayuno", "merienda"], ings: [["Yerba", 50], ["Pan", 4], ["Manteca", 20], ["Mermelada", 40]] },
  { key: "m2", name: "Licuado de banana", meals: ["desayuno", "merienda"], ings: [["Banana", 2], ["Leche", 500]] },
  { key: "m3", name: "Yogur con manzana", meals: ["merienda"], ings: [["Yogur natural", 300], ["Manzana", 2], ["Granola", 40]] },
  { key: "c1", name: "Pollo al horno con papas", meals: ["almuerzo", "cena"], ings: [["Pollo en presas", 1000], ["Papa", 700], ["Cebolla", 1], ["Aceite", 30], ["Romero", null], ["Sal", null]] },
  { key: "c2", name: "Tortilla de papas", meals: ["almuerzo", "cena"], ings: [["Papa", 700], ["Huevos", 5], ["Cebolla", 1], ["Aceite", 50], ["Sal", null]] },
  { key: "c3", name: "Wok de verduras con pollo y arroz", meals: ["almuerzo", "cena"], ings: [["Arroz", 200], ["Pechuga de pollo", 250], ["Morrón", 1], ["Zucchini", 1], ["Zanahoria", 1], ["Salsa de soja", 30]] },
  { key: "c4", name: "Crema de calabaza", meals: ["cena"], ings: [["Calabaza", 800], ["Cebolla", 1], ["Leche", 200], ["Pan", 4]] },
];

const TEMPLATES: { name: string; rows: string[][] }[] = [
  {
    name: "Semana clásica",
    rows: [
      ["d1", "a3", "m1", "c1"], ["d2", "a2", "m2", "c2"], ["d3", "a4", "m1", "c3"], ["d1", "a1", "m3", "c4"],
      ["d2", "a3", "m1", "c3"], ["d3", "a1", "m2", "c1"], ["d1", "a4", "m1", "c2"],
    ],
  },
  {
    name: "Semana liviana",
    rows: [
      ["d3", "a2", "m3", "c4"], ["d2", "a4", "m2", "c3"], ["d3", "a2", "m3", "c4"], ["d2", "a4", "m2", "c3"],
      ["d3", "a2", "m3", "c4"], ["d1", "a4", "m1", "c3"], ["d2", "a2", "m2", "c2"],
    ],
  },
];

const MEAL_ORDER: MealId[] = ["desayuno", "almuerzo", "merienda", "cena"];

async function main() {
  const db = getDb();
  const existing = await db.select({ id: recipes.id }).from(recipes).limit(1);
  if (existing.length) {
    console.log("Ya hay recetas cargadas; no se cargan datos de ejemplo.");
    return;
  }

  const ingRows = await db
    .insert(ingredients)
    .values(CATALOG.map(([name, unit, section]) => ({ key: normalizeKey(name), name, defaultUnit: unit, section })))
    .onConflictDoNothing()
    .returning();
  const ingByName = new Map(ingRows.map((r) => [r.name, r]));

  const recipeIdByKey = new Map<string, number>();
  for (const r of RECIPES) {
    const [row] = await db.insert(recipes).values({ name: r.name, meals: r.meals }).returning({ id: recipes.id });
    recipeIdByKey.set(r.key, row.id);
    await db.insert(recipeIngredients).values(
      r.ings.map(([name, qty], position) => {
        const ing = ingByName.get(name)!;
        return { recipeId: row.id, ingredientId: ing.id, qty, unit: qty == null ? null : ing.defaultUnit, position };
      }),
    );
  }

  await db
    .insert(storeSections)
    .values(DEFAULT_SECTIONS.map((section, position) => ({ section, position })))
    .onConflictDoNothing();

  for (const t of TEMPLATES) {
    const [tpl] = await db.insert(planTemplates).values({ name: t.name }).returning({ id: planTemplates.id });
    await db.insert(templateSlots).values(
      t.rows.flatMap((row, day) =>
        row.map((key, i) => ({ templateId: tpl.id, day, meal: MEAL_ORDER[i], recipeId: recipeIdByKey.get(key)!, isLeftover: false })),
      ),
    );
  }

  console.log(`Listo: ${RECIPES.length} recetas, ${CATALOG.length} ingredientes y ${TEMPLATES.length} planes favoritos.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
