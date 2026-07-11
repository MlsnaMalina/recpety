"use client";

import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/lib/types";
import Stars from "./Stars";
import { IconClock, IconPot } from "./icons";

const TINTS = [
  "bg-cyan-100 text-cyan-700",
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
];

function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return TINTS[h % TINTS.length];
}

export default function RecipeCard({
  recipe,
  imageUrl,
}: {
  recipe: Recipe;
  imageUrl?: string;
}) {
  return (
    <Link
      href={`/recept/${recipe.id}`}
      className="card flex items-center gap-3 p-3 active:scale-[0.99] transition-transform"
    >
      {imageUrl ? (
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        </span>
      ) : (
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tintFor(
            recipe.id
          )}`}
        >
          <IconPot size={24} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-medium">
            {recipe.title}
          </span>
          {recipe.rating ? <Stars value={recipe.rating} size={13} /> : null}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          {recipe.time_minutes ? (
            <>
              <IconClock size={13} /> {recipe.time_minutes} min ·{" "}
            </>
          ) : null}
          {recipe.category}
        </span>
        {recipe.source ? (
          <span className="block truncate text-[11px] text-slate-400">
            {recipe.source}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
