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

### Fáze 2 — Foto-import ✨ hotovo 11. 7. 2026
- [x] Anthropic účet a API klíč (uložen v .env.local a ve Vercelu, jen na serveru)
- [x] Vyfocení/nahrání stránky z kuchařky → AI (claude-opus-4-8) vytáhne název, suroviny,
  postup, porce, kategorii; jednotky normalizuje na tvary používané aplikací
- [x] Předvyplněný formulář ke kontrole a doladění před uložením
- [x] Podpora až 3 fotek na jeden recept (recept přes více stran)
- [x] AI záloha pro import z webu — weby bez strojové vizitky (např. kublanka.cz)
  teď čte AI z textu stránky
- Ochrany: fotky se zmenšují v telefonu před odesláním, limit velikosti a počtu,
  jednoduchý rate limit na serveru (klíč je placený a app je bez přihlášení)

### Fáze 3 — Import z webu ✅ hotovo 11. 7. 2026 (dřív, než se čekalo)
- [x] Vložení odkazu → aplikace stáhne recept a předvyplní formulář (název, kategorie,
  porce, čas, suroviny s množstvím, postup, zdroj jako klikací odkaz)
- Funguje bez AI — čte strukturovaná data (schema.org/Recipe), která má většina
  receptových webů. Weby bez nich vrátí srozumitelnou hlášku s radou zapsat ručně.
- [ ] Případně později: AI záloha pro weby bez strukturovaných dat (až bude API klíč)
- [ ] Případně později: stáhnout k receptu i fotku jídla z webu

### Fáze 4 — Nákupní seznam ✅ hotovo 11. 7. 2026
- [x] Z detailu receptu tlačítko „Přidat suroviny do nákupu" (respektuje počet porcí i vybranou část)
- [x] Sloučení stejných surovin (sečte množství), ruční přidávání položek
- [x] Odškrtávání v obchodě, „Smazat koupené"
- [x] Záložka Nákup ve spodní liště

### Fáze 5 — Vylepšení ✅ hotovo 11. 7. 2026
- [x] Dělení receptu na části (Tzatziki / Kuřecí kousky / Pita) — přepínač v detailu,
  zadávání ve formuláři, automatické rozpoznání při focení/importu, zahrnuto do vyhledávání
- [x] Oprava zadávání surovin (název na celý řádek, množství + jednotka pod ním)
- [x] Nová ikona aplikace (hrnec s růžovým srdíčkem na modré dlaždici)
- [x] Hezčí domovská stránka (vycentrovaný nadpis, počet receptů, karty v mřížce 2 sloupce)
- [x] Diktování hlasem (mikrofon u názvu, surovin i postupu; u surovin převede řeč na
  množství + jednotku + název; funguje hlavně v Chrome/Androidu)

### Fáze 5.1 — Doladění (11. 7. 2026)
- [x] Zrychlení domovské stránky — fotky se při nahrávání zmenšují na max 1400 px
  (dřív se ukládaly v plné velikosti z foťáku, jedna měla 3,3 MB); existující velká
  fotka jednorázově zmenšena. Načítání mřížky kleslo ze 4 MB na 0,9 MB.
- [x] Tlačítko „Rozdělit na části pomocí AI" na detailu receptu — u receptů bez částí
  je AI rozebere jedním ťuknutím (gyros → Kuře / Pita / Tzatziki / Brambory / Podávání)

### Fáze 6 — Varianty receptu ✅ hotovo 11. 7. 2026 (model A)

Varianta = **jiné provedení téhož jídla** (kuřecí řízky klasické × speciální s dijonskou
hořčicí, česnekem a panko strouhankou). Liší se od „částí": části = jedno jídlo z více dílů
(gyros = kuře + pita + tzatziki), varianty = děláte buď jednu, nebo druhou. Osy jsou nezávislé
(varianta může mít i části).

**Zvolený model (rozhodnuto s uživatelkou): A — samostatné propojené recepty.**
Každá varianta je vlastní recept propojený do skupiny. Vytvoří se zkopírováním a upraví se
jen rozdíly. Každá varianta má vlastní hvězdičky, poznámky, fotku i záznam do kalendáře.
Na hlavní stránce jedna kartička + odznáček „N variant".

Datový model:
- [ ] `recipes.variant_group_id uuid null` — recepty se stejným id jsou varianty téhož jídla
  (null = běžný samostatný recept)
- [ ] `recipes.variant_name text null` — název varianty („Klasická po babičce", „Speciální s panko")
- [ ] `recipes.is_primary_variant boolean default true` — která varianta se ukazuje na kartě
  seznamu (výchozí = ta původní; jde přepnout)

Chování:
- [ ] Detail receptu: nahoře přepínač variant (jako u částí) s názvy variant + „+ Přidat variantu"
- [ ] „Přidat variantu" zkopíruje aktuální recept (suroviny, postup, části, čas, kategorii),
  otevře formulář předvyplněný, nahoře pole „název varianty" — uložíte jen rozdíly.
  Při vytvoření první varianty se původnímu receptu doplní výchozí název (např. „Klasická"),
  který jde přejmenovat v úpravě.
- [ ] Hlavní stránka: recepty ve skupině se sloučí do jedné karty (primární varianta) s odznáčkem
  „N variant". Při vyhledávání se ukáže konkrétní varianta, která odpovídá (hledání „panko"
  najde speciální řízky).
- [ ] Úprava receptu: pole pro název varianty + možnost přepnout „zobrazit jako hlavní";
  smazání varianty; když ve skupině zbyde 1 recept, skupina se zruší (stane se samostatným).
- [ ] Vše ostatní (porce, nákup, sdílení jako obrázek s názvem varianty, dělení na části,
  kalendář) funguje pro každou variantu zvlášť automaticky.
- [ ] Migrace bez zásahu do stávajících receptů (sloupce nullable, žádný backfill).

Volitelně později:
- [ ] „Vytvořit variantu popisem" — nadiktujete/napíšete „jako klasické, ale přidej dijonskou
  hořčici, česnek a panko" a AI z klasického receptu vytvoří variantu (využije AI kredit).

## Zásady

- Mobil na prvním místě — v kuchyni je v ruce telefon (velká písmena u postupu,
  obrazovka nezhasíná při vaření).
- Přidání receptu musí být rychlejší než ruční opsání — jinak aplikace ztrácí smysl.
- Žádné tajné klíče v kódu, data chráněná na úrovni databáze (RLS).
