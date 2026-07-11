# 🍳 Moje recepty — plán aplikace

Osobní aplikace pro uchovávání receptů: ručně zapsaných, vyfocených z kuchařek
i stažených z webu. Minimalistická, vzdušná, stavěná primárně na mobil.

## Rozhodnutí (11. 7. 2026)

- **Uživatelé:** jen jedna uživatelka — jednoduché přihlášení e-mailem, recepty vidí jen ona.
- **Vzhled:** minimalistický. Pozadí bílé nebo světle šedé (nikdy krémová!), barvy modrá a tyrkysová
  s růžovým akcentem, laděné do pastelově neonových tónů. Tlačítka a prvky vystínované (jemné stíny, ne ploché).
  Hodnocení hvězdičkami (růžové).
- **Bonusy do dalších fází:** nákupní seznam, import receptu z webové adresy.
- **AI klíč (Anthropic):** zatím není — založení účtu provedeme společně, až na to přijde řada (fáze 2).

## Technologie

| Část | Volba | Proč |
|---|---|---|
| Aplikace | Next.js (React, TypeScript) | Moderní web, funguje jako „appka“ na telefonu (PWA — ikona na ploše) |
| Databáze + přihlášení + úložiště fotek | Supabase | Vše v jednom, zdarma pro osobní použití, zapnuté zabezpečení (RLS) |
| Čtení receptů z fotek | Claude API (vision) | Rozumí česky, zvládne i rukopis a složené stránky kuchařek |
| Hosting | Vercel | Zdarma, automatické nasazení z GitHubu |

## Datový model (zjednodušeně)

- **Recept:** název, kategorie/štítky, počet porcí (základ pro přepočet), doba přípravy,
  zdroj (kuchařka + strana / web / „od babičky“), fotka jídla, hodnocení (hvězdičky),
  datum posledního vaření.
- **Suroviny:** množství + jednotka + název, uložené strukturovaně (kvůli přepočtu porcí
  a pozdějšímu nákupnímu seznamu). Přepočet s chytrým zaokrouhlováním („1–2 vejce“, ne „1,33 vejce“).
- **Postup:** očíslované kroky.
- **Poznámky:** volný text s datem („příště méně cukru“).

## Fáze

### Fáze 1 — Základ (první funkční verze) ✅ hotovo 11. 7. 2026
- [x] Založení projektu, databáze Supabase, přihlášení e-mailem
- [x] Přidání a úprava receptu ručně (suroviny, postup, kategorie, fotka jídla, zdroj)
- [x] Seznam receptů — čisté kartičky s jemnými stíny, filtrování podle kategorií
- [x] Vyhledávání podle názvu i surovin — funguje i bez diakritiky
- [x] Detail receptu s přepočtem porcí (tlačítka − / +), obrazovka nezhasíná při vaření
- [x] Hodnocení (růžové hvězdičky), poznámky, tlačítko „Dnes uvařeno“
- [x] Nasazení na Vercel + PWA manifest a ikony

**Produkce:** https://moje-recepty-iota.vercel.app
**Supabase projekt:** Recepty (mjeqymqobpijsskcyjor, eu-central-1)
**Vercel projekt:** moje-recepty (deploy přes `vercel --prod`, zatím bez GitHubu — chybí `gh` CLI)

### Fáze 1.5 — Kalendář a sdílení ✅ hotovo 11. 7. 2026
- [x] GitHub propojen (https://github.com/MlsnaMalina/recpety) + automatické nasazování na Vercel
- [x] Kalendář vaření — měsíční pohled, puntíky u dnů, rozkliknutí dne se seznamem uvařených jídel
- [x] „Dnes uvařeno“ zapisuje záznam do kalendáře (tabulka cook_events)
- [x] Řazení receptů „Nejnovější / ★ Nejoblíbenější“
- [x] Sdílení receptu jako obrázek (WhatsApp a spol. přes systémové sdílení, jinak stažení PNG)

Drobnosti na doladění ve fázi 2:
- [ ] V Supabase nastavit Site URL na produkční adresu (kvůli registračním e-mailům)
- [ ] Změna hesla přímo v aplikaci

### ⚠️ Přihlašování dočasně vypnuto (11. 7. 2026)
Přihlašovací obrazovka dělala potíže (chyba prohlížeče při přihlášení) a bylo potřeba appku
rychle vyzkoušet. Na žádost uživatelky je přihlašování **dočasně vypnuté** — aplikace je
teď otevřená pro kohokoli, kdo zná adresu https://moje-recepty-iota.vercel.app.

- [x] `/login` odpojen, appka jede rovnou na hlavní stránku
- [x] Databáze upravena tak, aby všechna data zůstala navázaná na skutečný účet
  (zlatenkak@gmail.com), takže až se přihlašování vrátí, žádný recept se neztratí
- [ ] **Až nebude vadit, že appku uvidí kdokoli s odkazem, vrátit zpět zabezpečení**
  (přihlašovací obrazovka i uzamčení databáze na jednu uživatelku)
- [ ] Zjistit a opravit původní příčinu chyby při přihlášení (podezření na poškozený
  klíč na Vercelu při ručním zadávání přes PowerShell)

### Fáze 2 — Foto-import ✨ (hlavní kouzlo)
- [ ] Založení Anthropic účtu a API klíče (provedu krok za krokem; cena ~1 Kč za fotku)
- [ ] Vyfocení/nahrání stránky z kuchařky → AI vytáhne název, suroviny, postup, porce
- [ ] Předvyplněný formulář ke kontrole a doladění před uložením
- [ ] Podpora více fotek na jeden recept (recept přes dvě strany)

### Fáze 3 — Import z webu ✅ hotovo 11. 7. 2026 (dřív, než se čekalo)
- [x] Vložení odkazu → aplikace stáhne recept a předvyplní formulář (název, kategorie,
  porce, čas, suroviny s množstvím, postup, zdroj jako klikací odkaz)
- Funguje bez AI — čte strukturovaná data (schema.org/Recipe), která má většina
  receptových webů. Weby bez nich vrátí srozumitelnou hlášku s radou zapsat ručně.
- [ ] Případně později: AI záloha pro weby bez strukturovaných dat (až bude API klíč)
- [ ] Případně později: stáhnout k receptu i fotku jídla z webu

### Fáze 4 — Nákupní seznam
- [ ] Výběr jednoho či více receptů → sloučený seznam surovin na nákup
- [ ] Odškrtávání položek přímo v obchodě

## Zásady

- Mobil na prvním místě — v kuchyni je v ruce telefon (velká písmena u postupu,
  obrazovka nezhasíná při vaření).
- Přidání receptu musí být rychlejší než ruční opsání — jinak aplikace ztrácí smysl.
- Žádné tajné klíče v kódu, data chráněná na úrovni databáze (RLS).
