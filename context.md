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

## 22. 8. 2026 — obnova zapomenutého hesla

**Proč:** účet vytvořila dřívější session i s heslem, které uživatelka nikdy
neviděla. Po odhlášení neexistovala cesta zpět — přihlašovací obrazovka uměla
jen přihlášení a registraci.

**Pravidlo do budoucna:** heslo si volí uživatelka, nikdy ho negeneruj potichu.
Aplikace s přihlášením musí mít obnovu hesla hned od začátku.

**Jak to funguje:**

1. `/login` má třetí režim `reset` — odkaz *Zapomenuté heslo?* pošle přes
   `resetPasswordForEmail` odkaz na e-mail.
2. Odkaz míří na `/auth/callback?next=/nove-heslo`. Callback zvládne obě
   podoby odkazu: `code` (PKCE, stejný prohlížeč) i `token_hash` + `type`.
   Parametr `next` se validuje — jen cesta uvnitř aplikace, žádné `//cizi.web`.
3. `/nove-heslo` nastaví heslo přes `updateUser`. Bez platné session ukáže
   *Odkaz už neplatí* s tlačítkem na nový.

**Pojistka:** pokud Supabase produkční adresu nezná, hodí odkaz na úvodní
stránku místo na `/auth/callback`. `AuthGate` proto pozná parametry obnovy
(`code`, `token_hash`, `type=recovery`) i událost `PASSWORD_RECOVERY`
a přesměruje na `/nove-heslo`.

**POTVRZENO 22. 8. 2026:** Supabase projekt má v Authentication → URL
Configuration tovární nastavení, tedy Site URL  a prázdný
seznam Redirect URLs. Odkaz z e-mailu proto skončil na localhostu a na telefonu
hlásil, že web odmítá připojení.

Nutné nastavit v dashboardu (přes MCP se to měnit nedá):

- Site URL: - Redirect URLs: 
Po změně je potřeba nechat si poslat NOVÝ odkaz — ten starý už míří na localhost.
Stejná věc rozbíjí i potvrzovací e-mail při registraci.
