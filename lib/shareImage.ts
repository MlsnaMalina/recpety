import type { Recipe } from "./types";
import { scaleQty, servingsWord } from "./scale";
import { stepText } from "./recipeParts";

const W = 1080;
const PAD = 80;
const INK = "#0f172a";
const GRAY = "#64748b";
const BODY = "#334155";
const CYAN = "#0e7490";
const PINK = "#ec4899";
const STAR_EMPTY = "#cbd5e1";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Op = (ctx: CanvasRenderingContext2D) => void;

export async function shareRecipeAsImage(
  recipe: Recipe,
  servings: number
): Promise<"shared" | "downloaded" | "failed"> {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return "failed";

  const factor = servings / recipe.servings;
  const maxW = W - PAD * 2;
  const ops: Op[] = [];
  let y = PAD;

  function font(ctx: CanvasRenderingContext2D, spec: string) {
    ctx.font = `${spec} system-ui, -apple-system, "Segoe UI", sans-serif`;
  }

  measure.textBaseline = "alphabetic";
  font(measure, "600 62px");
  const titleLines = wrapText(measure, recipe.title, maxW);
  for (const line of titleLines) {
    const ly = y + 62;
    ops.push((ctx) => {
      font(ctx, "600 62px");
      ctx.fillStyle = INK;
      ctx.fillText(line, PAD, ly);
    });
    y += 78;
  }

  if (recipe.rating) {
    const rating = recipe.rating;
    const ly = y + 40;
    ops.push((ctx) => {
      font(ctx, "400 44px");
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < rating ? PINK : STAR_EMPTY;
        ctx.fillText("★", PAD + i * 54, ly);
      }
    });
    y += 62;
  }

  const metaParts = [
    `${servings} ${servingsWord(servings)}`,
    recipe.time_minutes ? `${recipe.time_minutes} min` : null,
    recipe.source,
  ].filter(Boolean);
  font(measure, "400 34px");
  for (const line of wrapText(measure, metaParts.join(" · "), maxW)) {
    const ly = y + 34;
    ops.push((ctx) => {
      font(ctx, "400 34px");
      ctx.fillStyle = GRAY;
      ctx.fillText(line, PAD, ly);
    });
    y += 46;
  }
  y += 30;

  if (recipe.ingredients.length > 0) {
    const ly = y + 42;
    ops.push((ctx) => {
      font(ctx, "600 42px");
      ctx.fillStyle = INK;
      ctx.fillText("Suroviny", PAD, ly);
    });
    y += 66;

    for (const ing of recipe.ingredients) {
      const qtyText = scaleQty(ing.qty, ing.unit, factor).text;
      font(measure, "600 34px");
      const qtyW = measure.measureText(qtyText).width;
      font(measure, "400 34px");
      const nameLines = wrapText(measure, ing.name, maxW - qtyW - 30);
      const baseY = y;
      ops.push((ctx) => {
        font(ctx, "600 34px");
        ctx.fillStyle = CYAN;
        ctx.fillText(qtyText, PAD, baseY + 34);
        font(ctx, "400 34px");
        ctx.fillStyle = BODY;
        nameLines.forEach((line, i) => {
          ctx.fillText(line, PAD + qtyW + 24, baseY + 34 + i * 44);
        });
      });
      y += 44 * nameLines.length + 8;
    }
    y += 30;
  }

  if (recipe.steps.length > 0) {
    const ly = y + 42;
    ops.push((ctx) => {
      font(ctx, "600 42px");
      ctx.fillStyle = INK;
      ctx.fillText("Postup", PAD, ly);
    });
    y += 66;

    recipe.steps.forEach((step, idx) => {
      font(measure, "400 34px");
      const lines = wrapText(measure, stepText(step), maxW - 70);
      const baseY = y;
      ops.push((ctx) => {
        ctx.fillStyle = "#cffafe";
        ctx.beginPath();
        ctx.arc(PAD + 24, baseY + 24, 24, 0, Math.PI * 2);
        ctx.fill();
        font(ctx, "600 28px");
        ctx.fillStyle = CYAN;
        ctx.textAlign = "center";
        ctx.fillText(String(idx + 1), PAD + 24, baseY + 34);
        ctx.textAlign = "left";
        font(ctx, "400 34px");
        ctx.fillStyle = BODY;
        lines.forEach((line, i) => {
          ctx.fillText(line, PAD + 70, baseY + 36 + i * 46);
        });
      });
      y += Math.max(46 * lines.length, 56) + 18;
    });
  }

  y += 20;
  const footerY = y + 30;
  ops.push((ctx) => {
    font(ctx, "400 28px");
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Moje recepty", W / 2, footerY);
    ctx.textAlign = "left";
  });
  y += 60 + PAD / 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = y;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "failed";

  ctx.fillStyle = "#f4f6f8";
  ctx.fillRect(0, 0, W, y);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(32, 32, W - 64, y - 64, 40);
  ctx.fill();
  ctx.textBaseline = "alphabetic";
  for (const op of ops) op(ctx);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) return "failed";

  const safeName = recipe.title
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  const file = new File([blob], `recept-${safeName}.png`, {
    type: "image/png",
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: recipe.title });
      return "shared";
    } catch {
      // uživatel sdílení zavřel — nabídneme stažení
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "downloaded";
}
