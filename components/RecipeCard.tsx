"use client";

import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/lib/types";
import Stars from "./Stars";
import { IconClock, IconPot, IconStack } from "./icons";

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

function Card({
  recipe,
  imageUrl,
  variantCount,
  variantLabel,
}: {
  recipe: Recipe;
  imageUrl?: string;
  variantCount?: number;
  variantLabel?: string;
}) {
  return (
    <Link
      href={`/recept/${recipe.id}`}
      className="card relative flex flex-col overflow-hidden active:scale-[0.98] transition-transform"
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
        {variantCount && variantCount > 1 ? (
          <span className="fab-shadow absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-cyan-500 px-2 py-0.5 text-[11px] font-medium text-white">
            <IconStack size={12} /> {variantCount} varianty
          </span>
        ) : null}
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
        {variantLabel ? (
          <span className="truncate text-xs font-medium text-cyan-600">
            {variantLabel}
          </span>
        ) : null}
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

export default function RecipeCard(props: {
  recipe: Recipe;
  imageUrl?: string;
  variantCount?: number;
  variantLabel?: string;
}) {
  if (props.variantCount && props.variantCount > 1) {
    return (
      <div className="relative">
        <span className="card absolute inset-x-2 bottom-[-6px] top-3 -z-0 block" />
        <div className="relative">
          <Card {...props} />
        </div>
      </div>
    );
  }
  return <Card {...props} />;
}
