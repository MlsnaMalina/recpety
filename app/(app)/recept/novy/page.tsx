"use client";

import { useState } from "react";
import Link from "next/link";
import RecipeForm, { type RecipePrefill } from "@/components/RecipeForm";
import { fileToEncodedImage } from "@/lib/clientImage";
import { IconBack, IconLink, IconCamera } from "@/components/icons";

export default function NewRecipePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState<"url" | "photo" | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<RecipePrefill | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  function applyPrefill(data: RecipePrefill) {
    setPrefill(data);
    setFormKey((k) => k + 1);
  }

  async function importFromUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading("url");
    setImportError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(
          typeof data.error === "string"
            ? data.error
            : "Recept se nepodařilo načíst."
        );
      } else {
        applyPrefill(data as RecipePrefill);
        setUrl("");
      }
    } catch {
      setImportError("Recept se nepodařilo načíst. Zkuste to znovu.");
    }
    setLoading(null);
  }

  async function importFromPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const selected = [...files].slice(0, 3);
    setLoading("photo");
    setImportError(null);
    setPhotoCount(selected.length);
    try {
      const images = await Promise.all(selected.map(fileToEncodedImage));
      const res = await fetch("/api/import-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(
          typeof data.error === "string"
            ? data.error
            : "Fotku se nepodařilo přečíst."
        );
      } else {
        applyPrefill(data as RecipePrefill);
      }
    } catch {
      setImportError("Fotku se nepodařilo přečíst. Zkuste to znovu.");
    }
    setLoading(null);
    setPhotoCount(0);
  }

  return (
    <main>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Zpět"
          className="soft-shadow flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500"
        >
          <IconBack size={18} />
        </Link>
        <h1 className="text-xl font-medium">Nový recept</h1>
      </div>

      <div className="card mb-3 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <IconCamera size={16} />
          </span>
          Vyfotit z kuchařky
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Vyfoťte stránku s receptem (klidně 2–3 fotky, když pokračuje dál) a
          přečtu ho za vás.
        </p>
        <label
          className={`chip-active-shadow mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white ${
            loading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <IconCamera size={17} />
          {loading === "photo"
            ? photoCount > 1
              ? `Čtu ${photoCount} fotky… (~půl minuty)`
              : "Čtu fotku… (~půl minuty)"
            : "Vyfotit nebo vybrat fotku"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={loading !== null}
            onChange={(e) => {
              importFromPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="card mb-5 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <IconLink size={16} />
          </span>
          Recept z webu
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Vložte odkaz na recept a já ho načtu za vás — pak už jen zkontrolujete
          a uložíte.
        </p>
        <form onSubmit={importFromUrl} className="mt-3 flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.recepty.cz/…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="soft-shadow w-full rounded-xl bg-white px-3 py-2.5 text-[15px]"
            aria-label="Odkaz na recept"
          />
          <button
            type="submit"
            disabled={loading !== null || !url.trim()}
            className="chip-active-shadow shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading === "url" ? "Načítám…" : "Načíst"}
          </button>
        </form>
      </div>

      {importError && (
        <p className="mb-5 rounded-xl bg-pink-50 px-3 py-2 text-sm text-pink-700">
          {importError}
        </p>
      )}
      {prefill && !importError && !loading && (
        <p className="mb-5 rounded-xl bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
          Recept „{prefill.title || "bez názvu"}“ je načtený ve formuláři níže —
          zkontrolujte ho a uložte.
        </p>
      )}

      <RecipeForm key={formKey} prefill={prefill ?? undefined} />
    </main>
  );
}
