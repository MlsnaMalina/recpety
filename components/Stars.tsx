"use client";

import { IconStar } from "./icons";

type Props = {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
};

export default function Stars({ value, size = 16, onChange }: Props) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`Hodnocení ${value} z 5`}>
        {stars.map((s) => (
          <IconStar
            key={s}
            size={size}
            filled={s <= value}
            className={s <= value ? "text-pink-500" : "text-slate-300"}
          />
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s === value ? 0 : s)}
          className="p-0.5 active:scale-90 transition-transform"
          aria-label={`Ohodnotit ${s} z 5`}
        >
          <IconStar
            size={size}
            filled={s <= value}
            className={s <= value ? "text-pink-500" : "text-slate-300"}
          />
        </button>
      ))}
    </span>
  );
}
