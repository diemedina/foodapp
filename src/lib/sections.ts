export const HOUSEHOLD_SECTION = "Para la casa";

export const DEFAULT_SECTIONS = [
  "Verdulería", "Carnicería", "Lácteos y huevos", "Panadería", "Almacén", "Otros", HOUSEHOLD_SECTION,
];

export const SECTION_DOT: Record<string, string> = {
  Verdulería: "#59D185",
  Carnicería: "#F4A58A",
  "Lácteos y huevos": "#9FC3EE",
  Panadería: "#F2C98A",
  Almacén: "#FFAD57",
  Otros: "#C9BCAD",
  [HOUSEHOLD_SECTION]: "#8FD0E8",
};

export function sectionDot(section: string): string {
  return SECTION_DOT[section] ?? "#C9BCAD";
}

export function sectionCategory(section: string) {
  return `section:${section}`;
}

export function isSectionCategory(category: string) {
  return category.startsWith("section:");
}

export function sectionFromCategory(category: string) {
  // Las categorías antiguas (Limpieza, Higiene, Hogar y Otros) pertenecen a Para la casa.
  return isSectionCategory(category) ? category.slice("section:".length) : HOUSEHOLD_SECTION;
}
