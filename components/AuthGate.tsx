"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Bez přihlášení vrací databáze prázdný seznam — a aplikace pak vypadá, jako by
// se recepty ztratily. Radši rovnou pošleme na přihlášení.
export default function AuthGate() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return null;
}
