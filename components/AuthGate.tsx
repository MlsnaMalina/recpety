"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Odkaz z e-mailu pro obnovu hesla nemusí vždy dorazit na /auth/callback —
// když Supabase adresu nezná, hodí uživatele na úvodní stránku. Tady to
// poznáme podle parametrů v adrese a pošleme ho, kam měl.
function isPasswordRecovery(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("type") === "recovery") return true;
  if (params.has("code") || params.has("token_hash")) return true;
  return window.location.hash.includes("type=recovery");
}

// Bez přihlášení vrací databáze prázdný seznam — a aplikace pak vypadá, jako by
// se recepty ztratily. Radši rovnou pošleme na přihlášení.
export default function AuthGate() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const recovery = isPasswordRecovery();

    supabase.auth.getSession().then(({ data }) => {
      if (recovery) {
        router.replace("/nove-heslo");
        return;
      }
      if (!data.session) router.replace("/login");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") router.replace("/nove-heslo");
      if (event === "SIGNED_OUT") router.replace("/login");
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return null;
}
