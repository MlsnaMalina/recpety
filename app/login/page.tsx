"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    params.get("error") === "confirm"
      ? "Potvrzení se nepovedlo, zkuste odkaz z e-mailu otevřít znovu."
      : null
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(
          error.message === "Invalid login credentials"
            ? "Nesprávný e-mail nebo heslo."
            : "Přihlášení se nepovedlo. Zkuste to znovu."
        );
        setBusy(false);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setMessage(
        error.message.includes("at least")
          ? "Heslo musí mít alespoň 6 znaků."
          : "Registrace se nepovedla. Zkuste to znovu."
      );
      setBusy(false);
      return;
    }
    setMessage(
      "Hotovo! Do e-mailu vám přišel potvrzovací odkaz — klikněte na něj a pak se přihlaste."
    );
    setMode("login");
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 pb-24">
      <div className="mb-8 text-center">
        <div className="soft-shadow mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-3xl font-medium text-white">
          R
        </div>
        <h1 className="text-2xl font-medium">Moje recepty</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vaše kuchařka, vždy po ruce
        </p>
      </div>

      <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
        <label className="text-sm text-slate-600">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="soft-shadow mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-base"
            autoComplete="email"
          />
        </label>
        <label className="text-sm text-slate-600">
          Heslo
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="soft-shadow mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-base"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {message && (
          <p className="rounded-xl bg-pink-50 px-3 py-2 text-sm text-pink-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="chip-active-shadow mt-1 rounded-xl bg-blue-500 py-2.5 font-medium text-white active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {busy
            ? "Pracuji…"
            : mode === "login"
              ? "Přihlásit se"
              : "Vytvořit účet"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage(null);
        }}
        className="mt-4 text-sm text-cyan-600"
      >
        {mode === "login"
          ? "Nemáte účet? Vytvořte si ho"
          : "Už máte účet? Přihlaste se"}
      </button>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
