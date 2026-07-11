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
      className="card flex flex-col overflow-hidden active:scale-[0.98] transition-transform"
    >
      <span className="relative block aspect-[4/3] w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 512px) 50vw, 240px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center ${tintFor(
              recipe.id
            )}`}
          >
            <IconPot size={34} />
          </span>
        )}
        {recipe.rating ? (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-1.5 py-0.5">
            <Stars value={recipe.rating} size={11} />
          </span>
        ) : null}
      </span>

      <span className="flex flex-1 flex-col gap-0.5 p-3">
        <span className="line-clamp-2 text-[14px] font-medium leading-snug">
          {recipe.title}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          {recipe.time_minutes ? (
            <>
              <IconClock size={12} /> {recipe.time_minutes} min ·{" "}
            </>
          ) : null}
          {recipe.category}
        </span>
      </span>
    </Link>
  );
}
