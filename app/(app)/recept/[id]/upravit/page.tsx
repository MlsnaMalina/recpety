"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl } from "@/lib/images";
import type { Recipe } from "@/lib/types";
import RecipeForm from "@/components/RecipeForm";
import { IconBack } from "@/components/icons";

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          const r = data as Recipe;
          setRecipe(r);
          if (r.image_path) setImageUrl(await getSignedUrl(r.image_path));
        }
        setLoaded(true);
      });
  }, [id]);

  if (!loaded) {
    return (
      <main className="py-20 text-center text-sm text-slate-400">Načítám…</main>
    );
  }

  if (!recipe) {
    return (
      <main className="py-20 text-center text-sm text-slate-500">
        Recept nenalezen.{" "}
        <Link href="/" className="text-cyan-600">
          Zpět na seznam
        </Link>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`/recept/${recipe.id}`}
          aria-label="Zpět"
          className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500"
        >
          <IconBack size={18} />
        </Link>
        <h1 className="text-xl font-medium">Upravit recept</h1>
      </div>
      <RecipeForm recipe={recipe} existingImageUrl={imageUrl} />
    </main>
  );
}
