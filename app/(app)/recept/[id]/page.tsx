"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl } from "@/lib/images";
import { scaleQty, servingsWord } from "@/lib/scale";
import { useWakeLock } from "@/lib/useWakeLock";
import { shareRecipeAsImage } from "@/lib/shareImage";
import { addIngredientsToShoppingList } from "@/lib/shopping";
import {
  recipeComponents,
  stepText,
  stepComponent,
  ingredientComponent,
} from "@/lib/recipeParts";
import type { Recipe, RecipeNote } from "@/lib/types";
import Stars from "@/components/Stars";
import {
  IconBack,
  IconClock,
  IconBook,
  IconPencil,
  IconTrash,
  IconPot,
  IconCheck,
  IconPlus,
  IconShare,
  IconCart,
} from "@/components/icons";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [notes, setNotes] = useState<RecipeNote[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [servings, setServings] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [missing, setMissing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selComp, setSelComp] = useState<string | null>(null);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  }

  useWakeLock();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setMissing(true);
          return;
        }
        const r = data as Recipe;
        setRecipe(r);
        setServings(r.servings);
        if (r.image_path) setImageUrl(await getSignedUrl(r.image_path));
      });
    supabase
      .from("recipe_notes")
      .select("*")
      .eq("recipe_id", id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotes((data ?? []) as RecipeNote[]));
  }, [id]);

  async function setRating(value: number) {
    if (!recipe) return;
    setRecipe({ ...recipe, rating: value || null });
    const supabase = createClient();
    await supabase
      .from("recipes")
      .update({ rating: value || null })
      .eq("id", recipe.id);
  }

  async function markCookedToday() {
    if (!recipe) return;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setRecipe({ ...recipe, last_cooked: today });
    const supabase = createClient();
    await supabase
      .from("recipes")
      .update({ last_cooked: today })
      .eq("id", recipe.id);
    const { data: existing } = await supabase
      .from("cook_events")
      .select("id")
      .eq("recipe_id", recipe.id)
      .eq("cooked_on", today)
      .limit(1);
    if (!existing?.length) {
      await supabase
        .from("cook_events")
        .insert({ recipe_id: recipe.id, cooked_on: today });
    }
    showToast("Zapsáno do kalendáře vaření");
  }

  async function share() {
    if (!recipe || servings === null) return;
    const result = await shareRecipeAsImage(recipe, servings);
    if (result === "downloaded") {
      showToast("Obrázek receptu je stažený v Souborech");
    } else if (result === "failed") {
      showToast("Sdílení se nepovedlo");
    }
  }

  async function addToShopping() {
    if (!recipe || servings === null) return;
    const list = selComp
      ? recipe.ingredients.filter((i) => ingredientComponent(i) === selComp)
      : recipe.ingredients;
    const count = await addIngredientsToShoppingList(
      list,
      servings / recipe.servings
    );
    showToast(
      count > 0
        ? `Přidáno do nákupního seznamu (${count} ${count === 1 ? "položka" : count < 5 ? "položky" : "položek"})`
        : "Recept nemá žádné suroviny"
    );
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!recipe || !noteText.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("recipe_notes")
      .insert({ recipe_id: recipe.id, text: noteText.trim() })
      .select("*")
      .single();
    if (data) {
      setNotes([data as RecipeNote, ...notes]);
      setNoteText("");
    }
  }

  async function deleteNote(noteId: string) {
    setNotes(notes.filter((n) => n.id !== noteId));
    const supabase = createClient();
    await supabase.from("recipe_notes").delete().eq("id", noteId);
  }

  async function deleteRecipe() {
    if (!recipe) return;
    if (!confirm(`Opravdu smazat recept „${recipe.title}“?`)) return;
    const supabase = createClient();
    await supabase.from("recipes").delete().eq("id", recipe.id);
    router.push("/");
    router.refresh();
  }

  if (missing) {
    return (
      <main className="py-20 text-center text-sm text-slate-500">
        Recept nenalezen.{" "}
        <Link href="/" className="text-cyan-600">
          Zpět na seznam
        </Link>
      </main>
    );
  }

  if (!recipe || servings === null) {
    return (
      <main className="py-20 text-center text-sm text-slate-400">Načítám…</main>
    );
  }

  const factor = servings / recipe.servings;
  const components = recipeComponents(recipe);
  const visibleIngredients = selComp
    ? recipe.ingredients.filter((i) => ingredientComponent(i) === selComp)
    : recipe.ingredients;
  const visibleSteps = selComp
    ? recipe.steps.filter((s) => stepComponent(s) === selComp)
    : recipe.steps;

  return (
    <main>
      {toast && (
        <div className="soft-shadow fixed left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-slate-800 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          aria-label="Zpět"
          className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500"
        >
          <IconBack size={18} />
        </Link>
        <div className="flex gap-2">
          <button
            onClick={share}
            aria-label="Sdílet recept jako obrázek"
            className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-cyan-600"
          >
            <IconShare size={17} />
          </button>
          <Link
            href={`/recept/${recipe.id}/upravit`}
            aria-label="Upravit recept"
            className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500"
          >
            <IconPencil size={17} />
          </Link>
          <button
            onClick={deleteRecipe}
            aria-label="Smazat recept"
            className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 active:text-pink-500"
          >
            <IconTrash size={17} />
          </button>
        </div>
      </div>

      {imageUrl ? (
        <div className="card relative mb-4 h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="card mb-4 flex h-32 flex-col items-center justify-center gap-1 text-slate-300">
          <IconPot size={30} />
          <span className="text-xs">zatím bez fotky</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-medium">{recipe.title}</h1>
        <Stars value={recipe.rating ?? 0} size={18} onChange={setRating} />
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
        {recipe.time_minutes ? (
          <span className="inline-flex items-center gap-1">
            <IconClock size={14} /> {recipe.time_minutes} min
          </span>
        ) : null}
        <span>{recipe.category}</span>
        {recipe.source ? (
          <span className="inline-flex items-center gap-1">
            <IconBook size={14} />
            {recipe.source.startsWith("http") ? (
              <a
                href={recipe.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 underline decoration-cyan-300 underline-offset-2"
              >
                {(() => {
                  try {
                    return new URL(recipe.source).hostname.replace(/^www\./, "");
                  } catch {
                    return recipe.source;
                  }
                })()}
              </a>
            ) : (
              recipe.source
            )}
          </span>
        ) : null}
      </p>

      {recipe.last_cooked ? (
        <p className="mt-1 text-xs text-slate-400">
          Naposledy vařeno{" "}
          {new Date(recipe.last_cooked).toLocaleDateString("cs-CZ")}
        </p>
      ) : null}

      <div className="card mt-4 flex items-center justify-between px-4 py-2.5">
        <button
          onClick={() => setServings(Math.max(1, servings - 1))}
          aria-label="Méně porcí"
          className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-medium text-cyan-600 active:scale-90 transition-transform"
        >
          −
        </button>
        <span className="text-[15px] font-medium">
          {servings} {servingsWord(servings)}
          {servings !== recipe.servings ? (
            <button
              onClick={() => setServings(recipe.servings)}
              className="ml-2 text-xs font-normal text-cyan-600"
            >
              původně {recipe.servings}
            </button>
          ) : null}
        </span>
        <button
          onClick={() => setServings(Math.min(24, servings + 1))}
          aria-label="Více porcí"
          className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-medium text-cyan-600 active:scale-90 transition-transform"
        >
          +
        </button>
      </div>

      {components.length > 0 && (
        <div className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setSelComp(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selComp === null
                ? "chip-active-shadow bg-blue-500 text-white"
                : "soft-shadow bg-white text-slate-500"
            }`}
          >
            Celý recept
          </button>
          {components.map((c) => (
            <button
              key={c}
              onClick={() => setSelComp(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selComp === c
                  ? "chip-active-shadow bg-blue-500 text-white"
                  : "soft-shadow bg-white text-slate-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {visibleIngredients.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-[15px] font-medium">Suroviny</h2>
          <div className="card px-4 py-1">
            {visibleIngredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2.5 text-[15px] last:border-b-0"
              >
                <span className="text-slate-700">{ing.name}</span>
                <span className="shrink-0 font-medium text-cyan-700">
                  {scaleQty(ing.qty, ing.unit, factor).text}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {visibleSteps.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-[15px] font-medium">Postup</h2>
          <ol className="flex flex-col gap-3">
            {visibleSteps.map((step, i) => (
              <li key={i} className="card flex gap-3 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-medium text-cyan-700">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed text-slate-700">
                  {stepText(step)}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      {visibleIngredients.length > 0 && (
        <button
          onClick={addToShopping}
          className="soft-shadow mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-medium text-cyan-600 active:scale-[0.99] transition-transform"
        >
          <IconCart size={18} />
          {selComp
            ? `Přidat suroviny na „${selComp}" do nákupu`
            : "Přidat suroviny do nákupu"}
        </button>
      )}

      <button
        onClick={markCookedToday}
        className="soft-shadow mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-medium text-cyan-600 active:scale-[0.99] transition-transform"
      >
        <IconCheck size={18} /> Dnes uvařeno
      </button>

      <h2 className="mt-6 mb-2 text-[15px] font-medium">Poznámky</h2>
      <form onSubmit={addNote} className="flex gap-2">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Příště méně cukru…"
          className="soft-shadow w-full rounded-xl bg-white px-3 py-2.5 text-[15px]"
        />
        <button
          type="submit"
          aria-label="Přidat poznámku"
          className="chip-active-shadow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white"
        >
          <IconPlus size={20} />
        </button>
      </form>
      <div className="mt-3 flex flex-col gap-2 pb-4">
        {notes.map((n) => (
          <div
            key={n.id}
            className="soft-shadow flex items-start justify-between gap-3 rounded-xl bg-pink-50 px-4 py-3"
          >
            <div>
              <p className="text-sm text-pink-900">{n.text}</p>
              <p className="mt-0.5 text-[11px] text-pink-400">
                {new Date(n.created_at).toLocaleDateString("cs-CZ")}
              </p>
            </div>
            <button
              onClick={() => deleteNote(n.id)}
              aria-label="Smazat poznámku"
              className="mt-0.5 shrink-0 text-pink-300 active:text-pink-500"
            >
              <IconTrash size={15} />
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
