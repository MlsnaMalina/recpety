import { NextResponse } from "next/server";
import { assignComponents } from "@/lib/aiExtract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Rozdělení není nastavené." },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Příliš mnoho pokusů za sebou — zkuste to za chvíli." },
      { status: 429 }
    );
  }

  let title: string;
  let ingredients: string[];
  let steps: string[];
  try {
    const body = await request.json();
    title = String(body.title ?? "");
    ingredients = body.ingredients;
    steps = body.steps;
    if (!Array.isArray(ingredients) || !Array.isArray(steps)) throw new Error();
    if (ingredients.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  if (ingredients.length + steps.length > 120) {
    return NextResponse.json(
      { error: "Recept je moc dlouhý na rozdělení." },
      { status: 400 }
    );
  }

  try {
    const result = await assignComponents(
      title,
      ingredients.map(String),
      steps.map(String)
    );
    if (!result) {
      return NextResponse.json({ split: false });
    }
    return NextResponse.json({ split: true, ...result });
  } catch {
    return NextResponse.json(
      { error: "Rozdělení se nepovedlo. Zkuste to za chvíli znovu." },
      { status: 502 }
    );
  }
}
