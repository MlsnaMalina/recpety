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

### Fáze 1 — Základ (první funkční verze)
- [ ] Založení projektu, databáze Supabase, přihlášení e-mailem
- [ ] Přidání a úprava receptu ručně (suroviny, postup, kategorie, fotka jídla, zdroj)
- [ ] Seznam receptů — čisté kartičky s jemnými stíny, filtrování podle kategorií
- [ ] Vyhledávání podle názvu i surovin („co uvařím z cukety?“)
- [ ] Detail receptu s posuvníkem porcí a přepočtem surovin
- [ ] Hodnocení a poznámky
- [ ] Nasazení na Vercel + instalace na plochu telefonu (PWA)

### Fáze 2 — Foto-import ✨ (hlavní kouzlo)
- [ ] Založení Anthropic účtu a API klíče (provedu krok za krokem; cena ~1 Kč za fotku)
- [ ] Vyfocení/nahrání stránky z kuchařky → AI vytáhne název, suroviny, postup, porce
- [ ] Předvyplněný formulář ke kontrole a doladění před uložením
- [ ] Podpora více fotek na jeden recept (recept přes dvě strany)

### Fáze 3 — Import z webu
- [ ] Vložení odkazu → aplikace stáhne recept a uloží ho ve vašem formátu

### Fáze 4 — Nákupní seznam
- [ ] Výběr jednoho či více receptů → sloučený seznam surovin na nákup
- [ ] Odškrtávání položek přímo v obchodě

## Zásady

- Mobil na prvním místě — v kuchyni je v ruce telefon (velká písmena u postupu,
  obrazovka nezhasíná při vaření).
- Přidání receptu musí být rychlejší než ruční opsání — jinak aplikace ztrácí smysl.
- Žádné tajné klíče v kódu, data chráněná na úrovni databáze (RLS).
