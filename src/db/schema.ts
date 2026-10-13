import {
  boolean,
  date,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/** Recetas. `meals` indica para qué comidas sirve (desayuno, almuerzo, merienda, cena). */
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  meals: text("meals").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Catálogo de ingredientes. `key` es el nombre normalizado (minúsculas, sin espacios extra). */
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  defaultUnit: text("default_unit"),
  section: text("section").notNull().default("Otros"),
});

/** Ingredientes de cada receta. Cantidad y unidad son opcionales ("Sal"). */
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  qty: real("qty"),
  unit: text("unit"),
  position: integer("position").notNull().default(0),
});

/** Una fila por semana; `weekStart` es siempre el lunes (YYYY-MM-DD). */
export const weekPlans = pgTable("week_plans", {
  id: serial("id").primaryKey(),
  weekStart: date("week_start", { mode: "string" }).notNull().unique(),
});

/** Cada comida planificada. `day` va de 0 (lunes) a 6 (domingo). */
export const planSlots = pgTable(
  "plan_slots",
  {
    id: serial("id").primaryKey(),
    weekPlanId: integer("week_plan_id")
      .notNull()
      .references(() => weekPlans.id, { onDelete: "cascade" }),
    day: smallint("day").notNull(),
    meal: text("meal").notNull(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    isLeftover: boolean("is_leftover").notNull().default(false),
  },
  (t) => [unique("plan_slots_week_day_meal").on(t.weekPlanId, t.day, t.meal)],
);

/** Productos tachados en la lista de compras de una semana. */
export const shoppingChecks = pgTable(
  "shopping_checks",
  {
    weekPlanId: integer("week_plan_id")
      .notNull()
      .references(() => weekPlans.id, { onDelete: "cascade" }),
    itemKey: text("item_key").notNull(),
  },
  (t) => [primaryKey({ columns: [t.weekPlanId, t.itemKey] })],
);

/** Ingredientes que ya hay en casa: no se compran. */
export const pantryItems = pgTable("pantry_items", {
  ingredientId: integer("ingredient_id")
    .primaryKey()
    .references(() => ingredients.id, { onDelete: "cascade" }),
});

/** Cosas de la casa que no son de las recetas (limpieza, higiene...). */
export const householdItems = pgTable("household_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Otros"),
  checked: boolean("checked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Orden de las secciones según el recorrido del súper. */
export const storeSections = pgTable("store_sections", {
  section: text("section").primaryKey(),
  position: integer("position").notNull(),
});

/** Planes favoritos (plantillas de semana). */
export const planTemplates = pgTable("plan_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const templateSlots = pgTable(
  "template_slots",
  {
    templateId: integer("template_id")
      .notNull()
      .references(() => planTemplates.id, { onDelete: "cascade" }),
    day: smallint("day").notNull(),
    meal: text("meal").notNull(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    isLeftover: boolean("is_leftover").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.templateId, t.day, t.meal] })],
);
