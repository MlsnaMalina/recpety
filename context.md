# Kontext projektu Recepty

Poznámky k rozhodnutím, aby další session nezačínala od nuly.

## 20. 8. 2026 — „zmizely recepty"

**Co se stalo:** Aplikace po pár dnech nepoužívání ukazovala prázdnou kuchařku.
Recepty se neztratily — Supabase na free tarifu uspí projekt po 7 dnech bez
aktivity (stav `INACTIVE`). Databáze neodpovídala, dotazy vracely chybu.

**Proč to vypadalo jako ztráta dat:** všechny stránky ignorovaly `error`
z dotazu a používaly `data ?? []`. Chyba se tak tvářila jako „prázdno":

- domovská stránka → *Zatím tu nic není. Přidejte první recept.*
- detail receptu → *Recept nenalezen.*
- nákup i kalendář → prázdné

Stejný efekt měl i odhlášený stav: bez session vrací databáze prázdný seznam
a nikde nebyla kontrola přihlášení.

**Rozhodnutí:**

1. `components/LoadError.tsx` — jednotná hláška „Teď se nedaří načíst …"
   s tlačítkem *Zkusit znovu*. Zapojena na domovské stránce, v detailu receptu,
   v nákupu a v kalendáři. Prázdný stav se smí ukázat jen po úspěšném načtení.
2. `components/AuthGate.tsx` v `app/(app)/layout.tsx` — bez session přesměruje
   na `/login` místo prázdné kuchařky.
3. `app/api/keepalive/route.ts` + `vercel.json` — Vercel cron jednou denně
   (6:00 UTC) klepne na databázi, aby Supabase projekt neusnul. Endpoint jde
   volitelně zamknout proměnnou `CRON_SECRET` (Vercel ji posílá v hlavičce
   `Authorization`).

**Pozor do budoucna:** cron je obcházka limitu free tarifu. Jistota proti
uspávání je až Supabase Pro. Když se cron nebude spouštět (např. změna limitů
Vercelu), projekt zase usne.

**Načítání dat:** loadery jsou psané jako `useCallback` vracející promise
z Supabase builderu se `setState` uvnitř `.then()`. Async varianta se
`setState` po `await` je sice čitelnější, ale pravidlo
`react-hooks/set-state-in-effect` ji hlásí jako chybu.
