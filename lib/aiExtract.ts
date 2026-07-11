import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const RecipeExtractionSchema = z.object({
  found: z
    .boolean()
    .describe("true pouze pokud vstup skutečně obsahuje recept"),
  title: z.string().describe("Název receptu"),
  category: z
    .string()
    .describe(
      "Nejbližší kategorie z: Polévky, Hlavní jídla, Pečení, Dezerty, Saláty, Přílohy, Snídaně, Rychlovky, Nápoje, Ostatní"
    ),
  servings: z
    .number()
    .nullable()
    .describe("Počet porcí, pokud je uveden, jinak null"),
  time_minutes: z
    .number()
    .nullable()
    .describe("Celková doba přípravy v minutách, pokud je uvedena, jinak null"),
  ingredients: z.array(
    z.object({
      name: z
        .string()
        .describe("Název suroviny v 1. pádě, malými písmeny"),
      qty: z
        .number()
        .nullable()
        .describe("Množství jako číslo (zlomky desetinně), jinak null"),
      unit: z
        .string()
        .describe(
          "Jednotka normalizovaná na: g, kg, ml, l, dl, ks, lžíce, lžička, hrnek, špetka, balení, plátek, stroužek — nebo prázdný řetězec"
        ),
      component: z
        .string()
        .describe(
          "Název části receptu, pokud se recept skládá z více částí (např. Tzatziki, Kuřecí kousky, Pita). Jinak prázdný řetězec."
        ),
    })
  ),
  steps: z.array(
    z.object({
      text: z.string().describe("Text kroku postupu, bez číslování"),
      component: z
        .string()
        .describe(
          "Název části receptu, ke které krok patří (stejné názvy jako u surovin). Jinak prázdný řetězec."
        ),
    })
  ),
});

export type RecipeExtraction = z.infer<typeof RecipeExtractionSchema>;

const SYSTEM = `Jsi pečlivý asistent, který přepisuje kuchařské recepty do strukturované podoby pro osobní aplikaci na recepty.

Pravidla:
- found nastav na true, jen pokud vstup opravdu obsahuje recept (suroviny nebo postup). Jinak found: false a ostatní pole nech prázdná.
- Zachovej původní české znění. Oprav jen zjevné překlepy a chyby rozpoznání textu z fotky.
- U fotek čti pečlivě i rukopis. Pokud recept pokračuje přes více fotek, spoj vše do jednoho receptu.
- Každou surovinu uveď zvlášť. Nadpisy skupin surovin (např. „Těsto:") vynech, nejsou to suroviny.
- Množství uváděj přepočtené na číslo (½ → 0.5). Slovní množství bez čísla (špetka, dle chuti) patří do unit nebo do názvu, qty pak null.
- Postup rozděl na krátké samostatné kroky v logickém pořadí.
- Pokud se recept skládá z několika samostatných částí (např. hlavní jídlo má vlastní omáčku, dip nebo přílohu — „Na tzatziki:", „Kuřecí kousky:", „Pita chleba:"), vyplň u každé suroviny i kroku pole component názvem té části. Používej krátké, výstižné názvy. Pokud je recept jednolitý, nech component prázdné u všech.
- Nic si nevymýšlej — co v receptu není, nech prázdné či null.`;

type ImageInput = {
  media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  data: string;
};

async function runExtraction(
  content: Anthropic.ContentBlockParam[]
): Promise<RecipeExtraction | null> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(RecipeExtractionSchema),
    },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") return null;
  const parsed = response.parsed_output;
  if (!parsed || !parsed.found) return null;
  return parsed;
}

export async function extractRecipeFromImages(
  images: ImageInput[]
): Promise<RecipeExtraction | null> {
  const content: Anthropic.ContentBlockParam[] = [
    ...images.map(
      (img): Anthropic.ContentBlockParam => ({
        type: "image",
        source: {
          type: "base64",
          media_type: img.media_type,
          data: img.data,
        },
      })
    ),
    {
      type: "text",
      text: "Přepiš recept z této fotky (případně fotek) do strukturované podoby.",
    },
  ];
  return runExtraction(content);
}

export async function extractRecipeFromText(
  pageText: string
): Promise<RecipeExtraction | null> {
  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `Následuje text z webové stránky. Najdi v něm recept a přepiš ho do strukturované podoby.\n\n${pageText}`,
    },
  ];
  return runExtraction(content);
}
