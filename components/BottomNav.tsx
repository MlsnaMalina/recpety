"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconPlus, IconCart } from "./icons";

export default function BottomNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div className="mx-auto max-w-lg px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="card mb-3 flex items-center justify-around px-2 py-2">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-[11px] font-medium ${
              onHome ? "text-blue-500" : "text-slate-400"
            }`}
          >
            <IconHome size={22} />
            Recepty
          </Link>
          <Link
            href="/recept/novy"
            aria-label="Přidat recept"
            className="fab-shadow -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white active:scale-95 transition-transform"
          >
            <IconPlus size={26} />
          </Link>
          <span
            className="flex cursor-default flex-col items-center gap-0.5 px-4 py-1 text-[11px] text-slate-300"
            title="Připravujeme"
          >
            <IconCart size={22} />
            Nákup
          </span>
        </div>
      </div>
    </nav>
  );
}
