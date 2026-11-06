/**
 * Adivina la sección del súper de un ingrediente a partir de su nombre, sin IA:
 * un diccionario de ingredientes comunes (en castellano rioplatense) con coincidencia
 * por palabras completas, singular/plural y sin acentos. Las frases más largas ganan
 * ("pan rallado" va a Almacén aunque "pan" sea de Panadería).
 */

import { normalizeKey } from "./units";

const DICTIONARY: Record<string, string[]> = {
  Verdulería: [
    "acelga", "ajo", "albahaca", "anana", "apio", "arandano", "banana", "batata", "berenjena", "brocoli",
    "calabaza", "cebolla", "cebolla de verdeo", "verdeo", "cereza", "champinon", "hongo", "chaucha", "choclo",
    "cilantro", "ciruela", "coliflor", "damasco", "durazno", "espinaca", "frambuesa", "frutilla", "fruta",
    "granada", "higo", "jengibre", "kale", "kiwi", "lechuga", "lima", "limon", "mandarina", "mango", "manzana",
    "melon", "menta", "morron", "naranja", "palta", "papa", "pepino", "pera", "perejil", "pimiento", "pomelo",
    "puerro", "rabanito", "radicheta", "remolacha", "repollo", "romero", "rucula", "sandia", "tomate",
    "tomate cherry", "uva", "verdura", "zanahoria", "zapallo", "zapallito", "zucchini", "hierba", "tomillo",
    "echalote", "esparrago", "habas", "arveja fresca", "nabo", "endivia", "berro", "aji", "jalapeno",
  ],
  Carnicería: [
    "carne", "carne picada", "picada", "nalga", "bife", "lomo", "vacio", "asado", "cuadril", "peceto", "osobuco",
    "matambre", "colita", "entrana", "milanesa", "bola de lomo", "roast beef", "tapa de asado", "costilla",
    "pollo", "pechuga", "muslo", "pata", "ala", "suprema", "cerdo", "bondiola", "carre", "chorizo", "morcilla",
    "salchicha", "hamburguesa", "pescado", "merluza", "salmon", "trucha", "langostino", "camaron", "marisco",
    "calamar", "mejillon", "pavo", "cordero", "conejo", "higado", "mondongo", "chinchulin", "molleja",
  ],
  "Lácteos y huevos": [
    "leche", "yogur", "yogurt", "queso", "queso crema", "queso rallado", "mozzarella", "muzzarella", "reggianito",
    "parmesano", "cheddar", "ricota", "manteca", "crema", "crema de leche", "dulce de leche", "huevo", "clara",
    "yema", "jamon", "jamon cocido", "jamon crudo", "salame", "mortadela", "panceta", "fiambre", "queso fresco",
    "provoleta", "roquefort", "postre", "flan", "margarina", "tapa de tarta", "tapa de empanada", "tapas de tarta",
    "masa de tarta", "masa de empanada", "tapa de empanadas",
  ],
  Panadería: [
    "pan", "pan lactal", "pan frances", "baguette", "medialuna", "factura", "prepizza", "pan de hamburguesa",
    "pan de pancho", "pan integral", "pan arabe", "chipa", "bizcocho", "grisin", "tostada", "budin",
  ],
  Almacén: [
    "arroz", "fideo", "pasta", "spaghetti", "tallarin", "harina", "harina leudante", "azucar", "sal", "pimienta",
    "aceite", "aceite de oliva", "vinagre", "aceto", "yerba", "cafe", "te", "mate cocido", "mermelada",
    "galletita", "cereal", "avena", "granola", "lenteja", "garbanzo", "poroto", "legumbre", "pure de tomate",
    "tomate triturado", "tomate perita en lata", "salsa", "salsa de tomate", "salsa de soja", "mayonesa", "ketchup",
    "mostaza", "atun", "caballa", "sardina", "arveja", "arveja en lata", "choclo en lata", "caldo", "especia",
    "oregano", "pimenton", "comino", "curry", "nuez moscada", "canela", "laurel", "provenzal", "levadura",
    "polvo de hornear", "chocolate", "cacao", "miel", "pan rallado", "rebozador", "aceituna", "maiz", "polenta",
    "quinoa", "semilla", "chia", "nuez", "almendra", "mani", "pasa de uva", "conserva", "lata", "gaseosa", "agua",
    "leche de coco", "jugo", "vino", "cerveza", "soda", "edulcorante", "esencia de vainilla", "vainilla", "coco rallado",
    "gelatina", "maicena", "fecula", "pure instantaneo", "sopa", "palmito", "alcaparra", "pickle", "snack",
    "papas fritas", "tapioca", "cuscus", "trigo", "bulgur", "sesamo", "lino",
  ],
};

const ENTRIES: { phrase: string; section: string }[] = Object.entries(DICTIONARY)
  .flatMap(([section, words]) => words.map((w) => ({ phrase: normalizeKey(w), section })))
  .sort((a, b) => b.phrase.length - a.phrase.length);

/** Devuelve la sección más probable, o "Otros" si no reconoce el ingrediente. */
export function guessSection(name: string): string {
  const text = ` ${normalizeKey(name)} `;
  const hit = ENTRIES.find((e) => text.includes(` ${e.phrase} `));
  return hit?.section ?? "Otros";
}
