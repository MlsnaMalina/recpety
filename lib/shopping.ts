"use client";

import { createClient } from "@/lib/supabase/client";
import type { Ingredient, ShoppingItem } from "@/lib/types";

function keyOf(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;
}

export async function addIngredientsToShoppingList(
  ingredients: Ingredient[],
  factor: number
): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("checked", false);
  const existing = (data ?? []) as ShoppingItem[];
  const byKey = new Map(existing.map((i) => [keyOf(i.name, i.unit), i]));

  let count = 0;
  for (const ing of ingredients) {
    if (!ing.name.trim()) continue;
    const scaled =
      ing.qty === null ? null : Math.round(ing.qty * factor * 100) / 100;
    const match = byKey.get(keyOf(ing.name, ing.unit));

    if (match && match.qty !== null && scaled !== null) {
      const newQty = Math.round((match.qty + scaled) * 100) / 100;
      await supabase
        .from("shopping_items")
        .update({ qty: newQty })
        .eq("id", match.id);
      match.qty = newQty;
    } else if (match && match.qty === null && scaled === null) {
      // stejná položka bez množství už na seznamu je — nic nepřidáváme
    } else {
      const { data: inserted } = await supabase
        .from("shopping_items")
        .insert({ name: ing.name.trim(), qty: scaled, unit: ing.unit.trim() })
        .select("*")
        .single();
      if (inserted) byKey.set(keyOf(ing.name, ing.unit), inserted as ShoppingItem);
    }
    count++;
  }
  return count;
}
