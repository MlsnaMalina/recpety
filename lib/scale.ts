const PLURALS: Record<string, [string, string, string]> = {
  lžíce: ["lžíce", "lžíce", "lžic"],
  lžička: ["lžička", "lžičky", "lžiček"],
  hrnek: ["hrnek", "hrnky", "hrnků"],
  špetka: ["špetka", "špetky", "špetek"],
  balení: ["balení", "balení", "balení"],
  plátek: ["plátek", "plátky", "plátků"],
  stroužek: ["stroužek", "stroužky", "stroužků"],
};

export function servingsWord(n: number): string {
  if (n === 1) return "porce";
  if (n < 5) return "porce";
  return "porcí";
}

function unitWord(unit: string, qty: number): string {
  const forms = PLURALS[unit];
  if (!forms) return unit;
  if (qty === 1) return forms[0];
  if (qty > 1 && qty < 5) return forms[1];
  return forms[2];
}

function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  if (Math.abs(frac - 0.5) < 0.01) {
    return whole > 0 ? `${whole}½` : "½";
  }
  if (Math.abs(frac - 0.25) < 0.01) {
    return whole > 0 ? `${whole}¼` : "¼";
  }
  if (Math.abs(frac - 0.75) < 0.01) {
    return whole > 0 ? `${whole}¾` : "¾";
  }
  return rounded.toLocaleString("cs-CZ");
}

export function scaleQty(
  qty: number | null,
  unit: string,
  factor: number
): { value: number | null; text: string } {
  if (qty === null || Number.isNaN(qty)) {
    return { value: null, text: unit ? unit : "podle chuti" };
  }
  const raw = qty * factor;
  let value: number;

  if (unit === "g" || unit === "ml") {
    value = raw < 100 ? Math.round(raw / 5) * 5 : Math.round(raw / 10) * 10;
    if (value === 0) value = Math.round(raw);
    return { value, text: `${value.toLocaleString("cs-CZ")} ${unit}` };
  }
  if (unit === "kg" || unit === "l") {
    value = Math.round(raw * 100) / 100;
    return { value, text: `${value.toLocaleString("cs-CZ")} ${unit}` };
  }
  value = Math.round(raw * 4) / 4;
  if (value === 0) value = 0.25;
  return { value, text: `${formatNumber(value)} ${unitWord(unit, value)}` };
}

export function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[̀-ͯ]/g, "");
}
