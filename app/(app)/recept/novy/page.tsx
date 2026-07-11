"use client";

import Link from "next/link";
import RecipeForm from "@/components/RecipeForm";
import { IconBack } from "@/components/icons";

export default function NewRecipePage() {
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
      <RecipeForm />
    </main>
  );
}
