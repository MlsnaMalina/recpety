"use client";

import { useState } from "react";
import { IconCloudOff } from "@/components/icons";

export default function LoadError({
  what,
  onRetry,
}: {
  what: string;
  onRetry: () => PromiseLike<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  async function retry() {
    setBusy(true);
    try {
      await onRetry();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
        <IconCloudOff size={26} />
      </span>
      <p className="font-medium">Teď se nedaří načíst {what}</p>
      <p className="text-sm text-slate-500">
        Nic se neztratilo — všechno je uložené a čeká. Zkontrolujte připojení
        k internetu a zkuste to znovu.
      </p>
      <button
        onClick={retry}
        disabled={busy}
        className="chip-active-shadow mt-2 rounded-xl bg-blue-500 px-5 py-2 font-medium text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? "Zkouším…" : "Zkusit znovu"}
      </button>
    </div>
  );
}
