import type { Ingredient } from "./types";

const UNIT_MAP: Record<string, string> = {
  g: "g",
  gram: "g",
  gramy: "g",
  gramu: "g",
  gramů: "g",
  dkg: "dkg",
  dag: "dkg",
  kg: "kg",
  kilo: "kg",
  kilogram: "kg",
  ml: "ml",
  mililitru: "ml",
  mililitrů: "ml",
  dcl: "dl",
  dl: "dl",
  l: "l",
  litr: "l",
  litry: "l",
  litru: "l",
  ks: "ks",
  kus: "ks",
  kusy: "ks",
  kusu: "ks",
  kusů: "ks",
  lžíce: "lžíce",
  lžic: "lžíce",
  lžíci: "lžíce",
  lzice: "lžíce",
  pl: "lžíce",
  lžička: "lžička",
  lžičky: "lžička",
  lžiček: "lžička",
  lžičku: "lžička",
  lzicka: "lžička",
  čl: "lžička",
  hrnek: "hrnek",
  hrnky: "hrnek",
  hrnků: "hrnek",
  hrneček: "hrnek",
  šálek: "hrnek",
  šálky: "hrnek",
  špetka: "špetka",
  špetky: "špetka",
  špetku: "špetka",
  balení: "balení",
  bal: "balení",
  balíček: "balení",
  plátek: "plátek",
  plátky: "plátek",
  plátků: "plátek",
  stroužek: "stroužek",
  stroužky: "stroužek",
  stroužků: "stroužek",
};

const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 0.33,
  "⅔": 0.67,
};

function parseNumber(raw: string): number | null {
  const s = raw.trim();
  if (FRACTIONS[s] !== undefined) return FRACTIONS[s];
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const num = parseInt(frac[1], 10);
    const den = parseInt(frac[2], 10);
    return den > 0 ? Math.round((num / den) * 100) / 100 : null;
  }
  const mixed = s.match(/^(\d+)\s*(½|¼|¾)$/);
  if (mixed) return parseInt(mixed[1], 10) + FRACTIONS[mixed[2]];
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const NUM_UNITS: Record<string, number> = {
  nula: 0, jedna: 1, jeden: 1, jedno: 1, dva: 2, dvě: 2, dve: 2, tři: 3, tri: 3,
  čtyři: 4, ctyri: 4, pět: 5, pet: 5, šest: 6, sest: 6, sedm: 7, osm: 8,
  devět: 9, devet: 9,
};
const NUM_TEENS: Record<string, number> = {
  deset: 10, jedenáct: 11, dvanáct: 12, třináct: 13, čtrnáct: 14, patnáct: 15,
  šestnáct: 16, sedmnáct: 17, osmnáct: 18, devatenáct: 19,
};
const NUM_TENS: Record<string, number> = {
  dvacet: 20, třicet: 30, čtyřicet: 40, padesát: 50, šedesát: 60,
  sedmdesát: 70, osmdesát: 80, devadesát: 90,
};
const NUM_HUNDREDS = new Set(["sto", "stě", "ste", "sta", "set"]);
const NUM_FRACTIONS: Record<string, number> = { půl: 0.5, pul: 0.5, čtvrt: 0.25, ctvrt: 0.25 };

/** Converts leading Czech number words into a digit, for dictated ingredients. */
export function parseSpokenIngredient(raw: string): Ingredient {
  const tokens = raw.trim().split(/\s+/);
  let total = 0;
  let current = 0;
  let consumed = 0;
  for (const tok of tokens) {
    const w = tok.toLowerCase().replace(/[.,]$/, "");
    if (NUM_HUNDREDS.has(w)) {
      current = (current || 1) * 100;
      total += current;
      current = 0;
    } else if (w in NUM_TEENS) {
      current += NUM_TEENS[w];
    } else if (w in NUM_TENS) {
      current += NUM_TENS[w];
    } else if (w in NUM_UNITS) {
      current += NUM_UNITS[w];
    } else if (w in NUM_FRACTIONS) {
      current += NUM_FRACTIONS[w];
      consumed++;
      break;
    } else if (w === "a") {
      // spojka mezi číslovkami, přeskoč
    } else {
      break;
    }
    consumed++;
  }
  const value = total + current;
  if (consumed > 0 && value > 0) {
    const rest = tokens.slice(consumed).join(" ");
    return parseIngredientLine(`${value} ${rest}`);
  }
  return parseIngredientLine(raw);
}

export function parseIngredientLine(raw: string): Ingredient {
  const text = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const m = text.match(
    /^((?:\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+|[½¼¾⅓⅔])(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*(.*)$/
  );

  if (!m) {
    return { name: text, qty: null, unit: "" };
  }

  const qtyRaw = m[1].split(/[-–]/)[0];
  const qty = parseNumber(qtyRaw);
  let rest = m[2].trim();

  const unitMatch = rest.match(/^([^\s(]+)\s*(.*)$/);
  let unit = "";
  if (unitMatch) {
    const candidate = unitMatch[1]
      .toLowerCase()
      .replace(/[.,;]$/, "");
    if (UNIT_MAP[candidate]) {
      unit = UNIT_MAP[candidate];
      rest = unitMatch[2].trim();
    }
  }

  if (!rest) {
    return { name: unit || text, qty: unit ? qty : null, unit: "" };
  }

  return { name: rest, qty, unit };
}
