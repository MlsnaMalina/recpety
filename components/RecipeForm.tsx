"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto, deletePhoto } from "@/lib/images";
import type { Recipe, Ingredient } from "@/lib/types";
import { CATEGORIES, UNITS, OWNER_ID } from "@/lib/types";
import Stars from "./Stars";
import { IconPlus, IconTrash, IconCamera } from "./icons";

type IngredientRow = { name: string; qty: string; unit: string };

type Props = {
  recipe?: Recipe;
  existingImageUrl?: string | null;
};

function toRows(ingredients: Ingredient[]): IngredientRow[] {
  return ingredients.map((i) => ({
    name: i.name,
    qty: i.qty === null ? "" : String(i.qty).replace(".", ","),
    unit: i.unit,
  }));
}

export default function RecipeForm({ recipe, existingImageUrl }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [category, setCategory] = useState(recipe?.category ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? 4);
  const [time, setTime] = useState(
    recipe?.time_minutes ? String(recipe.time_minutes) : ""
  );
  const [source, setSource] = useState(recipe?.source ?? "");
  const [rating, setRating] = useState(recipe?.rating ?? 0);
  const [rows, setRows] = useState<IngredientRow[]>(
    recipe ? toRows(recipe.ingredients) : [{ name: "", qty: "", unit: "" }]
  );
  const [steps, setSteps] = useState<string[]>(
    recipe?.steps?.length ? recipe.steps : [""]
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    existingImageUrl ?? null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setRow(i: number, patch: Partial<IngredientRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function parseQty(s: string): number | null {
    const t = s.trim().replace(",", ".");
    if (!t) return null;
    const n = parseFloat(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();

    const ingredients: Ingredient[] = rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        qty: parseQty(r.qty),
        unit: r.unit.trim(),
      }));
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);

    if (!title.trim()) {
      setError("Vyplňte název receptu.");
      setBusy(false);
      return;
    }

    let imagePath = recipe?.image_path ?? null;
    if (file) {
      const uploaded = await uploadPhoto(OWNER_ID, file);
      if (!uploaded) {
        setError("Nahrání fotky se nepovedlo. Zkuste to znovu.");
        setBusy(false);
        return;
      }
      if (recipe?.image_path) await deletePhoto(recipe.image_path);
      imagePath = uploaded;
    }

    const payload = {
      title: title.trim(),
      category: category.trim() || "Ostatní",
      servings,
      time_minutes: time.trim() ? parseInt(time, 10) || null : null,
      source: source.trim() || null,
      rating: rating || null,
      image_path: imagePath,
      ingredients,
      steps: cleanSteps,
    };

    if (recipe) {
      const { error: err } = await supabase
        .from("recipes")
        .update(payload)
        .eq("id", recipe.id);
      if (err) {
        setError("Uložení se nepovedlo. Zkuste to znovu.");
        setBusy(false);
        return;
      }
      router.push(`/recept/${recipe.id}`);
    } else {
      const { data, error: err } = await supabase
        .from("recipes")
        .insert(payload)
        .select("id")
        .single();
      if (err || !data) {
        setError("Uložení se nepovedlo. Zkuste to znovu.");
        setBusy(false);
        return;
      }
      router.push(`/recept/${data.id}`);
    }
    router.refresh();
  }

  const inputCls =
    "soft-shadow w-full rounded-xl bg-white px-3 py-2.5 text-[15px]";

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <label className="block">
        <span className="text-sm text-slate-600">Název receptu</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Kuřecí paprikáš"
          className={`${inputCls} mt-1`}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-slate-600">Kategorie</span>
          <input
            list="kategorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Hlavní jídla"
            className={`${inputCls} mt-1`}
          />
          <datalist id="kategorie">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Doba přípravy (min)</span>
          <input
            type="number"
            min={1}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="45"
            className={`${inputCls} mt-1`}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-slate-600">Počet porcí</span>
          <input
            type="number"
            min={1}
            max={24}
            value={servings}
            onChange={(e) =>
              setServings(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className={`${inputCls} mt-1`}
          />
        </label>
        <div className="block">
          <span className="text-sm text-slate-600">Hodnocení</span>
          <div className="soft-shadow mt-1 flex items-center justify-center rounded-xl bg-white px-3 py-2.5">
            <Stars value={rating} size={20} onChange={setRating} />
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-slate-600">
          Zdroj (kuchařka a strana, web, od koho…)
        </span>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Deník Dity P. · str. 84"
          className={`${inputCls} mt-1`}
        />
      </label>

      <div>
        <span className="text-sm text-slate-600">Fotka jídla</span>
        <label className="card mt-1 flex cursor-pointer items-center justify-center overflow-hidden">
          {preview ? (
            <span className="relative h-40 w-full">
              <Image
                src={preview}
                alt="Náhled fotky"
                fill
                className="object-cover"
                unoptimized
              />
            </span>
          ) : (
            <span className="flex flex-col items-center gap-1 py-8 text-slate-400">
              <IconCamera size={26} />
              <span className="text-sm">Vybrat fotku</span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
      </div>

      <div>
        <span className="text-sm text-slate-600">
          Suroviny (na {servings} porce)
        </span>
        <div className="mt-1 flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={row.qty}
                onChange={(e) => setRow(i, { qty: e.target.value })}
                placeholder="250"
                inputMode="decimal"
                className={`${inputCls} w-20 shrink-0`}
                aria-label="Množství"
              />
              <input
                list="jednotky"
                value={row.unit}
                onChange={(e) => setRow(i, { unit: e.target.value })}
                placeholder="g"
                className={`${inputCls} w-24 shrink-0`}
                aria-label="Jednotka"
              />
              <input
                value={row.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
                placeholder="hladká mouka"
                className={inputCls}
                aria-label="Surovina"
              />
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                aria-label="Odebrat surovinu"
                className="shrink-0 self-center p-1 text-slate-300 active:text-pink-500"
              >
                <IconTrash size={18} />
              </button>
            </div>
          ))}
          <datalist id="jednotky">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => setRows((r) => [...r, { name: "", qty: "", unit: "" }])}
            className="soft-shadow flex items-center justify-center gap-1 rounded-xl bg-white py-2 text-sm font-medium text-cyan-600"
          >
            <IconPlus size={16} /> Přidat surovinu
          </button>
        </div>
      </div>

      <div>
        <span className="text-sm text-slate-600">Postup</span>
        <div className="mt-1 flex flex-col gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-medium text-cyan-700">
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) =>
                  setSteps((s) => s.map((x, idx) => (idx === i ? e.target.value : x)))
                }
                rows={2}
                placeholder="Cibuli osmahneme dozlatova…"
                className={`${inputCls} resize-y`}
                aria-label={`Krok ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => setSteps((s) => s.filter((_, idx) => idx !== i))}
                aria-label="Odebrat krok"
                className="shrink-0 self-center p-1 text-slate-300 active:text-pink-500"
              >
                <IconTrash size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSteps((s) => [...s, ""])}
            className="soft-shadow flex items-center justify-center gap-1 rounded-xl bg-white py-2 text-sm font-medium text-cyan-600"
          >
            <IconPlus size={16} /> Přidat krok
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-pink-50 px-3 py-2 text-sm text-pink-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="soft-shadow flex-1 rounded-xl bg-white py-3 font-medium text-slate-500"
        >
          Zrušit
        </button>
        <button
          type="submit"
          disabled={busy}
          className="chip-active-shadow flex-1 rounded-xl bg-blue-500 py-3 font-medium text-white disabled:opacity-60"
        >
          {busy ? "Ukládám…" : "Uložit recept"}
        </button>
      </div>
    </form>
  );
}
