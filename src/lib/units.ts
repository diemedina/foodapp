/** Unidades, formato de cantidades y parser de líneas de ingredientes ("300 g Lentejas"). */

export const UNITS: Record<string, string> = {
  g: "g",
  gr: "g",
  grs: "g",
  kg: "kg",
  ml: "ml",
  cc: "ml",
  l: "l",
  lt: "l",
  u: "u",
  un: "u",
  unidad: "u",
  unidades: "u",
  cda: "cda",
  cdas: "cda",
  cdta: "cdta",
  cdtas: "cdta",
  taza: "taza",
  tazas: "taza",
  atado: "atado",
  atados: "atado",
  lata: "lata",
  latas: "lata",
  paquete: "paquete",
  paquetes: "paquete",
  rebanadas: "rebanadas",
  diente: "diente",
  dientes: "diente",
};

const UNIT_LABEL: Record<string, string> = {
  u: "u.",
  rebanadas: "reb.",
  atado: "atado",
  cda: "cda.",
  cdta: "cdta.",
  taza: "taza",
  lata: "lata",
  paquete: "paq.",
  diente: "diente",
};

const COUNTABLE = new Set(["u", "rebanadas", "atado", "lata", "paquete", "diente"]);

function num(n: number): string {
  return Number(n).toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

/** Formatea una cantidad: 1500 g → "1,5 kg". Devuelve "" si no hay cantidad. */
export function fmtAmount(qty: number | null | undefined, unit: string | null | undefined): string {
  if (qty == null || Number.isNaN(qty) || !unit) return "";
  if (unit === "g") return qty >= 1000 ? `${num(Math.round(qty / 10) / 100)} kg` : `${num(Math.round(qty))} g`;
  if (unit === "ml") return qty >= 1000 ? `${num(Math.round(qty / 10) / 100)} l` : `${num(Math.round(qty))} ml`;
  const q = COUNTABLE.has(unit) ? Math.ceil(qty - 0.001) : Math.round(qty * 10) / 10;
  return `${num(q)} ${UNIT_LABEL[unit] ?? unit}`;
}

export function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function capitalize(text: string): string {
  const t = text.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export type ParsedIngredient = { name: string; qty: number | null; unit: string | null };

/**
 * Interpreta una línea como "300 g Lentejas", "2 Huevos", "1,5 kg de papa" o solo "Sal".
 * Si no hay número, la cantidad y la unidad quedan en null.
 */
export function parseIngredientLine(line: string): ParsedIngredient | null {
  let tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  let qty: number | null = null;
  let unit: string | null = null;

  const glued = tokens[0].match(/^(\d+(?:[.,]\d+)?)([a-zA-Z]+)$/);
  if (glued && UNITS[glued[2].toLowerCase()]) {
    qty = parseFloat(glued[1].replace(",", "."));
    unit = UNITS[glued[2].toLowerCase()];
    tokens = tokens.slice(1);
  } else {
    const n = parseFloat(tokens[0].replace(",", "."));
    if (!Number.isNaN(n) && /^\d/.test(tokens[0])) {
      qty = n;
      tokens = tokens.slice(1);
      if (tokens.length > 1 && UNITS[tokens[0].toLowerCase()]) {
        unit = UNITS[tokens[0].toLowerCase()];
        tokens = tokens.slice(1);
      }
    }
  }
  if (tokens[0] && /^de$/i.test(tokens[0]) && tokens.length > 1) tokens = tokens.slice(1);
  const name = capitalize(tokens.join(" "));
  if (!name) return null;

  if (qty != null && unit === "kg") {
    qty *= 1000;
    unit = "g";
  }
  if (qty != null && unit === "l") {
    qty *= 1000;
    unit = "ml";
  }
  return { name, qty, unit };
}

/** Inverso de `parseIngredientLine`, para precargar el formulario al editar. */
export function ingredientToLine(i: { name: string; qty: number | null; unit: string | null }): string {
  if (i.qty == null) return i.name;
  const q = Math.round(i.qty * 100) / 100;
  return i.unit ? `${q} ${i.unit} ${i.name}` : `${q} ${i.name}`;
}
