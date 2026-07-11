"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrls } from "@/lib/images";
import { normalizeForSearch } from "@/lib/scale";
import type { Recipe, Ingredient } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";
import { IconSearch, IconPot } from "@/components/icons";

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "top">("newest");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const rows = (data ?? []) as Recipe[];
        setRecipes(rows);
        const paths = rows
          .map((r) => r.image_path)
          .filter((p): p is string => !!p);
        setImages(await getSignedUrls(paths));
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes ?? []) set.add(r.category);
    return [...set].sort((a, b) => a.localeCompare(b, "cs"));
  }, [recipes]);

  const visible = useMemo(() => {
    let rows = recipes ?? [];
    if (category) rows = rows.filter((r) => r.category === category);
    const q = normalizeForSearch(query.trim());
    if (q) {
      rows = rows.filter((r) => {
        if (normalizeForSearch(r.title).includes(q)) return true;
        return (r.ingredients as Ingredient[]).some((i) =>
          normalizeForSearch(i.name).includes(q)
        );
      });
    }
    if (sort === "top") {
      rows = [...rows].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return rows;
  }, [recipes, query, category, sort]);

  return (
    <main>
      <h1 className="text-2xl font-medium">Moje recepty</h1>
      <p className="mt-0.5 text-sm text-slate-500">Co dnes uvaříme?</p>

      <label className="soft-shadow mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5">
        <IconSearch size={17} className="shrink-0 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat recept nebo surovinu…"
          className="w-full bg-transparent text-[15px] placeholder:text-slate-400"
        />
      </label>

      {categories.length > 0 && (
        <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === null
                ? "chip-active-shadow bg-blue-500 text-white"
                : "soft-shadow bg-white text-slate-500"
            }`}
          >
            Vše
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? null : c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "chip-active-shadow bg-blue-500 text-white"
                  : "soft-shadow bg-white text-slate-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {(recipes?.length ?? 0) > 0 && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setSort("newest")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              sort === "newest"
                ? "soft-shadow bg-white text-cyan-700"
                : "text-slate-400"
            }`}
          >
            Nejnovější
          </button>
          <button
            onClick={() => setSort("top")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              sort === "top"
                ? "soft-shadow bg-white text-pink-600"
                : "text-slate-400"
            }`}
          >
            ★ Nejoblíbenější
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {recipes === null ? (
          <p className="py-10 text-center text-sm text-slate-400">Načítám…</p>
        ) : visible.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <IconPot size={26} />
            </span>
            {recipes.length === 0 ? (
              <>
                <p className="font-medium">Zatím tu nic není</p>
                <p className="text-sm text-slate-500">
                  Přidejte první recept tyrkysovým tlačítkem dole.
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Tomuhle hledání neodpovídá žádný recept.
              </p>
            )}
          </div>
        ) : (
          visible.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              imageUrl={r.image_path ? images[r.image_path] : undefined}
            />
          ))
        )}
      </div>
    </main>
  );
}
