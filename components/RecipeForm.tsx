"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto, deletePhoto } from "@/lib/images";
import { resizeImageForUpload } from "@/lib/clientImage";
import { parseSpokenIngredient } from "@/lib/parseIngredient";
import { stepText, stepComponent } from "@/lib/recipeParts";
import { useDictation } from "@/lib/useDictation";
import type { Recipe, Ingredient, RecipeStep } from "@/lib/types";
import { CATEGORIES, UNITS, OWNER_ID } from "@/lib/types";
import Stars from "./Stars";
import { IconPlus, IconTrash, IconCamera, IconMic } from "./icons";

type IngredientRow = { name: string; qty: string; unit: string; component: string };
type StepRow = { text: string; component: string };

export type RecipePrefill = {
  title?: string;
  category?: string;
  servings?: number | null;
  time_minutes?: number | null;
  source?: string;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
};

type Props = {
  recipe?: Recipe;
  existingImageUrl?: string | null;
  prefill?: RecipePrefill;
};

function toRows(ingredients: Ingredient[]): IngredientRow[] {
  return ingredients.map((i) => ({
    name: i.name,
    qty: i.qty === null ? "" : String(i.qty).replace(".", ","),
    unit: i.unit,
    component: i.component ?? "",
  }));
}

function toStepRows(steps: RecipeStep[]): StepRow[] {
  return steps.map((s) => ({ text: stepText(s), component: stepComponent(s) }));
}

function hasAnyComponent(
  ingredients?: Ingredient[],
  steps?: RecipeStep[]
): boolean {
  return (
    (ingredients ?? []).some((i) => i.component?.trim()) ||
    (steps ?? []).some((s) => typeof s !== "string" && s.component?.trim())
  );
}

export default function RecipeForm({ recipe, existingImageUrl, prefill }: Props) {
  const router = useRouter();
  const dict = useDictation();

  const initialIngredients = recipe?.ingredients ?? prefill?.ingredients;
  const initialSteps = recipe?.steps ?? prefill?.steps;

  const [title, setTitle] = useState(recipe?.title ?? prefill?.title ?? "");
  const [category, setCategory] = useState(
    recipe?.category ?? prefill?.category ?? ""
  );
  const [servings, setServings] = useState(
    recipe?.servings ?? prefill?.servings ?? 4
  );
  const [time, setTime] = useState(
    recipe?.time_minutes
      ? String(recipe.time_minutes)
      : prefill?.time_minutes
        ? String(prefill.time_minutes)
        : ""
  );
  const [source, setSource] = useState(recipe?.source ?? prefill?.source ?? "");
  const [rating, setRating] = useState(recipe?.rating ?? 0);
  const [rows, setRows] = useState<IngredientRow[]>(
    initialIngredients?.length
      ? toRows(initialIngredients)
      : [{ name: "", qty: "", unit: "", component: "" }]
  );
  const [steps, setSteps] = useState<StepRow[]>(
    initialSteps?.length ? toStepRows(initialSteps) : [{ text: "", component: "" }]
  );
  const [useComponents, setUseComponents] = useState(
    hasAnyComponent(initialIngredients, initialSteps)
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingImageUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const componentNames = Array.from(
    new Set(
      [...rows, ...steps].map((r) => r.component.trim()).filter(Boolean)
    )
  );

  function setRow(i: number, patch: Partial<IngredientRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function setStep(i: number, patch: Partial<StepRow>) {
    setSteps((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function parseQty(s: string): number | null {
    const t = s.trim().replace(",", ".");
    if (!t) return null;
    const n = parseFloat(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function applySpokenIngredient(i: number, text: string) {
    const parsed = parseSpokenIngredient(text);
    setRow(i, {
      name: parsed.name,
      qty: parsed.qty === null ? "" : String(parsed.qty).replace(".", ","),
      unit: parsed.unit,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();

    const ingredients: Ingredient[] = rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const ing: Ingredient = {
          name: r.name.trim(),
          qty: parseQty(r.qty),
          unit: r.unit.trim(),
        };
        if (useComponents && r.component.trim()) ing.component = r.component.trim();
        return ing;
      });

    const cleanSteps: RecipeStep[] = steps
      .filter((s) => s.text.trim())
      .map((s) =>
        useComponents && s.component.trim()
          ? { text: s.text.trim(), component: s.component.trim() }
          : s.text.trim()
      );

    if (!title.trim()) {
      setError("Vyplňte název receptu.");
      setBusy(false);
      return;
    }

    let imagePath = recipe?.image_path ?? null;
    if (file) {
      const resized = await resizeImageForUpload(file);
      const uploaded = await uploadPhoto(OWNER_ID, resized);
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

  const baseCls = "soft-shadow rounded-xl bg-white px-3 py-2.5 text-[15px]";
  const inputCls = `${baseCls} w-full`;

  function Mic({ id, onText }: { id: string; onText: (t: string) => void }) {
    if (!dict.supported) return null;
    const active = dict.listeningId === id;
    return (
      <button
        type="button"
        onClick={() => (active ? dict.stop() : dict.start(id, onText))}
        aria-label="Diktovat"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-pink-500 text-white animate-pulse"
            : "soft-shadow bg-white text-pink-500"
        }`}
      >
        <IconMic size={17} />
      </button>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <label className="block">
        <span className="text-sm text-slate-600">Název receptu</span>
        <div className="mt-1 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Kuřecí paprikáš"
            className={inputCls}
          />
          <Mic id="title" onText={setTitle} />
        </div>
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

      <label className="soft-shadow flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
        <input
          type="checkbox"
          checked={useComponents}
          onChange={(e) => setUseComponents(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-cyan-500"
        />
        <span className="text-sm text-slate-700">
          Recept má víc částí (např. Tzatziki, Kuřecí kousky, Pita)
        </span>
      </label>

      <datalist id="jednotky">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <datalist id="casti">
        {componentNames.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div>
        <span className="text-sm text-slate-600">
          Suroviny (na {servings} porce)
        </span>
        <div className="mt-1 flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-2xl bg-slate-100 p-2.5"
            >
              <div className="flex gap-2">
                <input
                  value={row.name}
                  onChange={(e) => setRow(i, { name: e.target.value })}
                  placeholder="hladká mouka"
                  className={inputCls}
                  aria-label="Surovina"
                />
                <Mic
                  id={`ing-${i}`}
                  onText={(t) => applySpokenIngredient(i, t)}
                />
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                  aria-label="Odebrat surovinu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center self-start text-slate-400 active:text-pink-500"
                >
                  <IconTrash size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={row.qty}
                  onChange={(e) => setRow(i, { qty: e.target.value })}
                  placeholder="250"
                  inputMode="decimal"
                  className={`${baseCls} w-24 shrink-0`}
                  aria-label="Množství"
                />
                <input
                  list="jednotky"
                  value={row.unit}
                  onChange={(e) => setRow(i, { unit: e.target.value })}
                  placeholder="jednotka"
                  className={`${baseCls} min-w-0 flex-1`}
                  aria-label="Jednotka"
                />
              </div>
              {useComponents && (
                <input
                  list="casti"
                  value={row.component}
                  onChange={(e) => setRow(i, { component: e.target.value })}
                  placeholder="část (Tzatziki…)"
                  className={inputCls}
                  aria-label="Část receptu"
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setRows((r) => [...r, { name: "", qty: "", unit: "", component: "" }])
            }
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
            <div
              key={i}
              className="flex flex-col gap-2 rounded-2xl bg-slate-100 p-2.5"
            >
              <div className="flex gap-2">
                <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-medium text-cyan-700">
                  {i + 1}
                </span>
                <textarea
                  value={step.text}
                  onChange={(e) => setStep(i, { text: e.target.value })}
                  rows={2}
                  placeholder="Cibuli osmahneme dozlatova…"
                  className={`${inputCls} resize-y`}
                  aria-label={`Krok ${i + 1}`}
                />
                <div className="flex flex-col gap-2">
                  <Mic
                    id={`step-${i}`}
                    onText={(t) =>
                      setStep(i, {
                        text: step.text ? `${step.text} ${t}` : t,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setSteps((s) => s.filter((_, idx) => idx !== i))}
                    aria-label="Odebrat krok"
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 active:text-pink-500"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>
              {useComponents && (
                <input
                  list="casti"
                  value={step.component}
                  onChange={(e) => setStep(i, { component: e.target.value })}
                  placeholder="část (Tzatziki…)"
                  className={inputCls}
                  aria-label="Část receptu"
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSteps((s) => [...s, { text: "", component: "" }])}
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
