import type { MealId } from "./types";

export type MealInfo = {
  id: MealId;
  name: string;
  time: string;
  /** Fondo pastel y color de texto que se usan en tarjetas y etiquetas. */
  bg: string;
  fg: string;
};

export const MEALS: MealInfo[] = [
  { id: "desayuno", name: "Desayuno", time: "8:00", bg: "#FFE3C4", fg: "#8A4300" },
  { id: "almuerzo", name: "Almuerzo", time: "13:00", bg: "#D6F5E3", fg: "#17663C" },
  { id: "merienda", name: "Merienda", time: "17:00", bg: "#FFF1C9", fg: "#7A5300" },
  { id: "cena", name: "Cena", time: "21:00", bg: "#E8E4F8", fg: "#463A86" },
];

export const MEAL_IDS: MealId[] = MEALS.map((m) => m.id);

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function isMealId(value: unknown): value is MealId {
  return typeof value === "string" && (MEAL_IDS as string[]).includes(value);
}

export function mealOf(id: MealId): MealInfo {
  return MEALS.find((m) => m.id === id) ?? MEALS[0];
}

/** Qué comida corresponde a una hora del día. */
export function mealForHour(hour: number): MealId {
  if (hour >= 5 && hour < 11) return "desayuno";
  if (hour >= 11 && hour < 15) return "almuerzo";
  if (hour >= 15 && hour < 19) return "merienda";
  return "cena";
}

export const MOMENT: Record<MealId, string> = {
  desayuno: "Hora del desayuno",
  almuerzo: "Hora del almuerzo",
  merienda: "Hora de la merienda",
  cena: "Hora de la cena",
};

export function slotKey(day: number, meal: MealId): string {
  return `${day}-${meal}`;
}

export function parseSlotKey(key: string): { day: number; meal: MealId } {
  const [d, meal] = key.split("-");
  return { day: Number(d), meal: meal as MealId };
}

/** Índice cronológico de una comida dentro de la semana (0 = desayuno del lunes). */
export function slotIndex(day: number, meal: MealId): number {
  return day * 4 + MEAL_IDS.indexOf(meal);
}

export function slotAt(index: number): { day: number; meal: MealId } {
  return { day: Math.floor(index / 4), meal: MEAL_IDS[index % 4] };
}

const ARTICLE: Record<MealId, string> = {
  desayuno: "el desayuno",
  almuerzo: "el almuerzo",
  merienda: "la merienda",
  cena: "la cena",
};

/** "la cena del lunes" */
export function slotLabel(day: number, meal: MealId): string {
  return `${ARTICLE[meal]} del ${DAYS[day].toLowerCase()}`;
}

export function mealsText(meals: MealId[]): string {
  const names = MEALS.filter((m) => meals.includes(m.id)).map((m) => m.name);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

export function sortMeals(meals: MealId[]): MealId[] {
  return MEAL_IDS.filter((id) => meals.includes(id));
}
