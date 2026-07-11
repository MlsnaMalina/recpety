"use client";

import { useState } from "react";
import Link from "next/link";
import RecipeForm, { type RecipePrefill } from "@/components/RecipeForm";
import { IconBack, IconLink } from "@/components/icons";

export default function NewRecipePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<RecipePrefill | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function importFromUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
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
        setPrefill(data as RecipePrefill);
        setFormKey((k) => k + 1);
        setUrl("");
      }
    } catch {
      setImportError("Recept se nepodařilo načíst. Zkuste to znovu.");
    }
    setLoading(false);
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
            disabled={loading || !url.trim()}
            className="chip-active-shadow shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Načítám…" : "Načíst"}
          </button>
        </form>
        {importError && (
          <p className="mt-2 rounded-xl bg-pink-50 px-3 py-2 text-sm text-pink-700">
            {importError}
          </p>
        )}
        {prefill && !importError && (
          <p className="mt-2 rounded-xl bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
            Recept „{prefill.title || "bez názvu"}“ je načtený ve formuláři níže
            — zkontrolujte ho a uložte.
          </p>
        )}
      </div>

      <RecipeForm key={formKey} prefill={prefill ?? undefined} />
    </main>
  );
}
