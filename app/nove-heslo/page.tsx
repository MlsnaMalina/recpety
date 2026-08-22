"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== again) {
      setMessage("Hesla se neshodují — napište prosím obě stejně.");
      return;
    }
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(
        error.message.toLowerCase().includes("at least") ||
          error.message.toLowerCase().includes("6 characters")
          ? "Heslo musí mít alespoň 6 znaků."
          : error.message.toLowerCase().includes("different from the old")
            ? "Tohle heslo už na účtu je — zvolte prosím jiné."
            : "Heslo se nepodařilo změnit. Nechte si prosím poslat nový odkaz."
      );
      setBusy(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 pb-24">
      <div className="mb-8 text-center">
        <div className="soft-shadow mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-3xl font-medium text-white">
          R
        </div>
        <h1 className="text-2xl font-medium">Nové heslo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Zvolte si takové, které si zapamatujete
        </p>
      </div>

      {ready === null ? (
        <p className="py-10 text-center text-sm text-slate-400">Načítám…</p>
      ) : ready === false ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
          <p className="font-medium">Odkaz už neplatí</p>
          <p className="text-sm text-slate-500">
            Odkaz na nové heslo platí jen chvíli a musí se otevřít ve stejném
            prohlížeči, ze kterého jste o něj žádala.
          </p>
          <Link
            href="/login"
            className="chip-active-shadow mt-2 rounded-xl bg-blue-500 px-5 py-2 font-medium text-white"
          >
            Nechat poslat nový
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
          <label className="text-sm text-slate-600">
            Nové heslo
            <input
              type={show ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="soft-shadow mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-base"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <label className="text-sm text-slate-600">
            Ještě jednou pro kontrolu
            <input
              type={show ? "text" : "password"}
              required
              minLength={6}
              value={again}
              onChange={(e) => setAgain(e.target.value)}
              className="soft-shadow mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-base"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <button
            type="button"
            onClick={() => setShow(!show)}
            className="self-start text-sm text-cyan-600"
          >
            {show ? "Skrýt heslo" : "Zobrazit heslo"}
          </button>

          {message && (
            <p className="rounded-xl bg-pink-50 px-3 py-2 text-sm text-pink-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="chip-active-shadow mt-1 rounded-xl bg-blue-500 py-2.5 font-medium text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Ukládám…" : "Uložit nové heslo"}
          </button>
        </form>
      )}
    </main>
  );
}
