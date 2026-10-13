/** Secciones del súper (para ingredientes) y categorías de cosas de la casa. */

export const DEFAULT_SECTIONS = ["Verdulería", "Carnicería", "Lácteos y huevos", "Panadería", "Almacén", "Otros"];

export const SECTION_DOT: Record<string, string> = {
  Verdulería: "#59D185",
  Carnicería: "#F4A58A",
  "Lácteos y huevos": "#9FC3EE",
  Panadería: "#F2C98A",
  Almacén: "#FFAD57",
  Otros: "#C9BCAD",
};

export function sectionDot(section: string): string {
  return SECTION_DOT[section] ?? "#C9BCAD";
}

export const HOUSEHOLD_CATEGORIES = [
  { id: "Limpieza", bg: "#D3EEF7", fg: "#14506A" },
  { id: "Higiene", bg: "#F9DCE8", fg: "#74244A" },
  { id: "Hogar", bg: "#F5E6C8", fg: "#6B4A12" },
  { id: "Otros", bg: "#EFE7DC", fg: "#4A4038" },
] as const;

export function householdCategory(id: string) {
  return HOUSEHOLD_CATEGORIES.find((c) => c.id === id) ?? HOUSEHOLD_CATEGORIES[3];
}
