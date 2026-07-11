import { NextResponse } from "next/server";
import { parseIngredientLine } from "@/lib/parseIngredient";
import { extractRecipeFromText } from "@/lib/aiExtract";
import type { Ingredient } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type JsonLd = Record<string, unknown>;

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "::1" || h.endsWith(".local")) return true;
  if (/^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function pageToPlainText(html: string): string {
  const withoutBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, "\n");
  return decodeEntities(withoutBlocks.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, 60_000);
}

function findRecipeNode(node: unknown): JsonLd | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  const obj = node as JsonLd;
  const type = obj["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => typeof t === "string" && t.toLowerCase() === "recipe")) {
    return obj;
  }
  if (obj["@graph"]) return findRecipeNode(obj["@graph"]);
  return null;
}

function isoDurationToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^-?PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return null;
  const minutes = (parseInt(m[1] ?? "0", 10) || 0) * 60 + (parseInt(m[2] ?? "0", 10) || 0);
  return minutes > 0 ? minutes : null;
}

function extractServings(value: unknown): number | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first === "number" && first > 0) return Math.min(24, Math.round(first));
  if (typeof first === "string") {
    const m = first.match(/\d+/);
    if (m) {
      const n = parseInt(m[0], 10);
      if (n > 0) return Math.min(24, n);
    }
  }
  return null;
}

function extractSteps(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return stripHtml(value)
      .split(/(?:\r?\n)+|(?<=\.)\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    const steps: string[] = [];
    for (const item of value) {
      if (typeof item === "string") {
        const t = stripHtml(item);
        if (t) steps.push(t);
      } else if (item && typeof item === "object") {
        const obj = item as JsonLd;
        if (Array.isArray(obj.itemListElement)) {
          steps.push(...extractSteps(obj.itemListElement));
        } else if (typeof obj.text === "string") {
          const t = stripHtml(obj.text);
          if (t) steps.push(t);
        } else if (typeof obj.name === "string") {
          const t = stripHtml(obj.name);
          if (t) steps.push(t);
        }
      }
    }
    return steps;
  }
  return [];
}

export async function POST(request: Request) {
  let target: URL;
  try {
    const body = await request.json();
    target = new URL(String(body.url ?? ""));
  } catch {
    return NextResponse.json({ error: "Neplatná adresa." }, { status: 400 });
  }

  if (
    (target.protocol !== "http:" && target.protocol !== "https:") ||
    isPrivateHost(target.hostname)
  ) {
    return NextResponse.json({ error: "Neplatná adresa." }, { status: 400 });
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "cs,en;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Stránku se nepodařilo stáhnout." },
        { status: 422 }
      );
    }
    html = (await res.text()).slice(0, 3_000_000);
  } catch {
    return NextResponse.json(
      { error: "Stránku se nepodařilo stáhnout." },
      { status: 422 }
    );
  }

  const scripts = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  let recipeNode: JsonLd | null = null;
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      recipeNode = findRecipeNode(parsed);
      if (recipeNode) break;
    } catch {
      // nevalidní JSON blok přeskočíme
    }
  }

  if (!recipeNode) {
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const aiRecipe = await extractRecipeFromText(pageToPlainText(html));
        if (aiRecipe) {
          return NextResponse.json({
            title: aiRecipe.title,
            category: aiRecipe.category,
            servings: aiRecipe.servings,
            time_minutes: aiRecipe.time_minutes,
            source: target.toString(),
            ingredients: aiRecipe.ingredients,
            steps: aiRecipe.steps,
          });
        }
      } catch {
        // AI záloha selhala — spadneme na srozumitelnou hlášku níže
      }
    }
    return NextResponse.json(
      {
        error:
          "Na téhle stránce se mi recept nepodařilo najít. Zkuste jiný web, nebo recept zapište ručně.",
      },
      { status: 422 }
    );
  }

  const rawIngredients = Array.isArray(recipeNode.recipeIngredient)
    ? recipeNode.recipeIngredient
    : Array.isArray(recipeNode.ingredients)
      ? recipeNode.ingredients
      : [];

  const ingredients: Ingredient[] = rawIngredients
    .filter((i): i is string => typeof i === "string")
    .map((i) => parseIngredientLine(stripHtml(i)))
    .filter((i) => i.name);

  const steps = extractSteps(recipeNode.recipeInstructions);

  const time =
    isoDurationToMinutes(recipeNode.totalTime) ??
    (() => {
      const cook = isoDurationToMinutes(recipeNode.cookTime) ?? 0;
      const prep = isoDurationToMinutes(recipeNode.prepTime) ?? 0;
      return cook + prep > 0 ? cook + prep : null;
    })();

  const category =
    typeof recipeNode.recipeCategory === "string"
      ? stripHtml(recipeNode.recipeCategory)
      : Array.isArray(recipeNode.recipeCategory) &&
          typeof recipeNode.recipeCategory[0] === "string"
        ? stripHtml(recipeNode.recipeCategory[0])
        : "";

  return NextResponse.json({
    title: typeof recipeNode.name === "string" ? stripHtml(recipeNode.name) : "",
    category,
    servings: extractServings(recipeNode.recipeYield),
    time_minutes: time,
    source: target.toString(),
    ingredients,
    steps,
  });
}
