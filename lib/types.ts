export type Ingredient = {
  name: string;
  qty: number | null;
  unit: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  servings: number;
  time_minutes: number | null;
  source: string | null;
  rating: number | null;
  image_path: string | null;
  ingredients: Ingredient[];
  steps: string[];
  last_cooked: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeNote = {
  id: string;
  recipe_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

export type CookEvent = {
  id: string;
  recipe_id: string;
  user_id: string;
  cooked_on: string;
  created_at: string;
  recipes?: {
    title: string;
    rating: number | null;
    category: string;
  } | null;
};

export const CATEGORIES = [
  "Polévky",
  "Hlavní jídla",
  "Pečení",
  "Dezerty",
  "Saláty",
  "Přílohy",
  "Snídaně",
  "Rychlovky",
  "Nápoje",
  "Ostatní",
] as const;

export const UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "ks",
  "lžíce",
  "lžička",
  "hrnek",
  "špetka",
  "balení",
  "plátek",
  "stroužek",
] as const;
