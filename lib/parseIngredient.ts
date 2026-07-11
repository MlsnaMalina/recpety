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
