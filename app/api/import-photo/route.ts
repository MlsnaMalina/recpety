import { NextResponse } from "next/server";
import { extractRecipeFromImages } from "@/lib/aiExtract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGES = 3;
const MAX_IMAGE_BASE64_CHARS = 7_000_000;

const RATE_LIMIT = 15;
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
      { error: "Čtení fotek není nastavené." },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Příliš mnoho fotek za sebou — zkuste to za chvíli." },
      { status: 429 }
    );
  }

  let images: { media_type: string; data: string }[];
  try {
    const body = await request.json();
    images = body.images;
    if (!Array.isArray(images) || images.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Najednou zvládnu nejvýše ${MAX_IMAGES} fotky.` },
      { status: 400 }
    );
  }
  for (const img of images) {
    if (
      !ALLOWED_TYPES.has(img.media_type) ||
      typeof img.data !== "string" ||
      img.data.length === 0 ||
      img.data.length > MAX_IMAGE_BASE64_CHARS
    ) {
      return NextResponse.json(
        { error: "Fotka je moc velká nebo v nepodporovaném formátu." },
        { status: 400 }
      );
    }
  }

  try {
    const recipe = await extractRecipeFromImages(
      images as Parameters<typeof extractRecipeFromImages>[0]
    );
    if (!recipe) {
      return NextResponse.json(
        {
          error:
            "Na fotce se mi recept nepodařilo přečíst. Zkuste ji vyfotit znovu — ostře, zpříma a při dobrém světle.",
        },
        { status: 422 }
      );
    }
    return NextResponse.json({
      title: recipe.title,
      category: recipe.category,
      servings: recipe.servings,
      time_minutes: recipe.time_minutes,
      source: "Vyfoceno z kuchařky",
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    });
  } catch {
    return NextResponse.json(
      { error: "Čtení fotky se nepovedlo. Zkuste to za chvíli znovu." },
      { status: 502 }
    );
  }
}
