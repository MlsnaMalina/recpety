import type { Ingredient, Recipe, RecipeStep } from "./types";
import { normalizeForSearch } from "./scale";

export function stepText(step: RecipeStep): string {
  return typeof step === "string" ? step : step.text;
}

export function stepComponent(step: RecipeStep): string {
  return typeof step === "string" ? "" : (step.component ?? "");
}

export function ingredientComponent(ing: Ingredient): string {
  return ing.component ?? "";
}

/** Distinct component (sub-recipe) names, in order of first appearance. */
export function recipeComponents(recipe: {
  ingredients: Ingredient[];
  steps: RecipeStep[];
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (c: string) => {
    const t = c.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };
  for (const ing of recipe.ingredients) add(ingredientComponent(ing));
  for (const step of recipe.steps) add(stepComponent(step));
  return out;
}

/** Text used for full-text search — includes component names. */
export function recipeSearchText(recipe: Recipe): string {
  const parts: string[] = [recipe.title];
  for (const ing of recipe.ingredients) {
    parts.push(ing.name);
    if (ing.component) parts.push(ing.component);
  }
  for (const step of recipe.steps) {
    const c = stepComponent(step);
    if (c) parts.push(c);
  }
  return normalizeForSearch(parts.join(" "));
}
