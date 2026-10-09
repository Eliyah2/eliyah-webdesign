# Eliyah Webdesign — portfolio

Portfolio van **Eliyah Impelmans**, webdesigner & developer uit Roermond.
Gebouwd met vanilla HTML, CSS en JavaScript — geen frameworks, geen build-stap.

## Kenmerken

- **High-end uitstraling** — donker design system met aurora-achtergrond, filmgrain en glaswerk
- **Licht & donker thema** — schakelbaar, keuze wordt onthouden en volgt anders de systeemvoorkeur
- **Micro-interacties** — scroll-reveals, 3D-tilt, magnetische knoppen, custom cursor (alleen desktop)
- **Volledig responsive** — van 320px tot breedbeeld, met een eigen mobiel menu
- **Toegankelijk** — semantische HTML, toetsenbordnavigatie, focus-states en `prefers-reduced-motion`
- **Meetbaar** — cookieloze doelmeting naar een eigen verzamelpunt: kliks, secties en
  leesdiepte, zonder cookies en zonder bezoekersgegevens (zie *Doelmeting* onderaan)

## Structuur

```
.
├── index.html              # Homepage (hero, over mij, diensten, werkwijze, projecten,
│                           # pakketten, onderhoudspakketten, ervaringen, FAQ, contact)
├── 404.html                # Eigen foutpagina (absolute paden, want een 404 kan overal opduiken)
├── style.css               # Design system + alle componenten
├── script.js               # Interactie (thema, cursor, reveals, tellers, filter, formulier, WhatsApp)
├── analytics.js            # Cookieloze doelmeting (stuurt naar het eigen verzamelpunt)
├── logo.svg                # Logo (ook favicon)
├── apple-touch-icon.png    # Icoon voor "zet op beginscherm" (180x180)
├── icon-512.png            # Icoon voor het webmanifest
├── site.webmanifest        # App-manifest (naam, kleuren, iconen)
├── robots.txt              # Crawlinstructies + verwijzing naar de sitemap
├── sitemap.xml             # Alle acht pagina's met lastmod
├── og/                     # Social-previewkaarten van 1200x630 (index.jpg + per case)
├── tools/
│   ├── og-card.html        # Generator-template voor de previewkaarten
│   └── icon.html           # Generator-template voor de pictogrammen
├── meting/                 # Verzamelpunt + dashboard van de doelmeting (geen website)
└── projects/
    ├── glanzza.html        # Case: boekingsplatform met Wero-aanbetaling
    ├── menuapp.html        # Case: tafelbestelsysteem Las Tapas
    ├── hairshop.html       # Case: website John's Hairshop (live)
    ├── funforest.html      # Case: FunForest Seizoenskaart (mobiele app)
    ├── greenhouse.html     # Case: kas-dashboard
    ├── widgets.html        # Case: UI-widgets
    ├── funkyfries.html     # Case: restaurantwebsite
    ├── style.css           # Aanvullende projectpagina-styling
    └── img/                # Beelden per project (WebP waar het kan)
```

## Projecten

| Project | Wat het is | Techniek |
| --- | --- | --- |
| [Glanzza](projects/glanzza.html) | Boekings- en no-show-tool: eigen boekingspagina per bedrijf, Wero-aanbetaling, centrale backend | Vanilla JS, Apps Script, Sheets |
| [Tafelbestelsysteem Las Tapas](projects/menuapp.html) | QR-bestellen aan tafel, keukenscherm, uitgifte met goedkeuring en voorraadbeheer | Next.js, API-routes |
| [John's Hairshop](projects/hairshop.html) | Website voor een kapsalon in Venlo en Blerick — live op Vercel | HTML/CSS, live |
| [FunForest Seizoenskaart](projects/funforest.html) | Mobiele app met digitale seizoenkaart, QR-check-in en reserveringen | React Native (Expo), Supabase |
| [Greenhouse Dashboard](projects/greenhouse.html) | Realtime monitoring en automatisering voor kasventilatie | Dashboard, realtime data |
| [Portfolio Widgets](projects/widgets.html) | Interactieve UI-widgets met API-data en dark mode | Vanilla JS, API |
| [Funky Fries](projects/funkyfries.html) | Restaurantwebsite met eigen branding | HTML/CSS, branding |

## Diensten & pakketten

| Eenmalig | Prijs | Maandelijks onderhoud | Prijs |
| --- | --- | --- | --- |
| Starter — one-pager | €175 | Zorg Basis | €29 p/m |
| Business — 3–5 pagina's | €350 | Zorg Groei | €59 p/m |
| Premium — maatwerk, shop of dashboard | vanaf €650 | Zorg Zorgeloos | €99 p/m |

Onderhoudspakketten zijn maandelijks opzegbaar: updates, back-ups, monitoring
en support. Losse aanpassing zonder pakket: €45 per uur.

> Let op: de pakketprijzen liggen onder wat in de markt gebruikelijk is
> (freelancer-uurtarief rond €75–84, websites bij kleine bureaus vanaf €750).
> De prijzen zijn bewust nog niet aangepast — dat is een keuze die Eliyah zelf
> moet maken, niet iets wat de code hoort te verzinnen.

## Aanpassen

**WhatsApp aanzetten.** Zet je nummer één keer in `script.js` bij
`WHATSAPP_NUMBER` (landcode zonder `+` of `00`, bijvoorbeeld `31612345678`).
Dan verschijnen automatisch de WhatsApp-links in de contactlijst, bij het
contactformulier en in de footer. Laat je het leeg, dan blijven die knoppen
verborgen in plaats van dat er een dode link op de site staat.

**Geen reviews op de site.** Er staan bewust geen beoordelingen of sterren op de
homepage zolang die niet van een echte klant met naam en bedrijf komen. Vraagt
John's Hairshop er een, zet die quote dan in de sectie onder *Pakketten* — een
voorbeeld van de oude opmaak staat in de git-geschiedenis (`git show ff343a1`).

**Resultaat per project.** Elke projectkaart heeft een regel
`<p class="project__result">` met de opbrengst van dat project. Vervang die
tekst door een echt cijfer of een quote zodra je die hebt — dat overtuigt
meer dan een beschrijving.

**Toegankelijkheid.** Elke pagina begint met een skip-link naar de inhoud,
heeft `tabindex="-1"` op de hoofdinhoud en verstuurt formulieren met
`autocomplete` zodat browsers en wachtwoordmanagers kunnen invullen.

**Over mij is bewust faceless.** De kaart "Over mij" gebruikt de initialen in de
merkgradient in plaats van een foto. Wil je later toch een portret toevoegen,
dan staat in `style.css` bij `.about__avatar` precies welke twee regels je
daarvoor aanzet.

**Social links.** Er staat nu geen socialaccount meer op de site. Komt er later
één (bijvoorbeeld TikTok), zet die dan op dezelfde plek terug: in de footer van
`index.html` bij `.footer__social`, en in de contactlijst bij `#contact`. Eén
link, niet vier — een lege of half gevulde socialrij valt meer op dan geen rij.

## Doelmeting (cookieloos)

`analytics.js` telt wat er op de site gebeurt, zonder cookies en zonder
bezoekersgegevens:

| Wat | Gebeurtenis | Waarom |
| --- | --- | --- |
| Bezoek per pagina | `pageview` | welke pagina's en cases gelezen worden |
| Klik op een knop naar het formulier | `kennismaken_click` | met label ("Start met Business") en sectie ("pakketten") |
| WhatsApp, e-mail, bellen | `whatsapp_click`, `email_click`, `call_click` | welk kanaal klanten kiezen |
| Case openen | `case_open` | welke case het meest wordt bekeken |
| Formulier | `form_start`, `form_submit`, `form_error` | waar het formulier afhaakt |
| Hoe ver men leest | `scroll_25/50/75/100` | waar bezoekers afhaken |
| Secties gezien | `section_view` | welk deel van de homepage aandacht krijgt |

**Waar het naartoe gaat.** Naar je eigen verzamelpunt: de Worker in `meting/`
met een D1-database. Geen account, geen abonnement, geen cookiebanner.

**Het dashboard** staat op:

```
https://site-a007329577464ef5b5cebd3eb85a2874.freebuff.page/stats?token=JOUW-TOKEN
```

Het token staat **niet** in deze repository maar in `.freebuff/meting-token.txt`
in de projectmap (die map staat in `.gitignore`). Zonder dat token geeft het
dashboard 404 — ook voor wie het adres raadt. Bewaar de link als bookmark; hij
is alleen voor jou.

**Bezoekers merken niets van de meting.** Geen balk, geen paneel, geen
verzoek van een andere partij. Het meetpaneel met `?meting=1` werkt alleen op
`localhost` (of met `debug: true` in de configuratie), dus op de echte site is er
niets te zien. Bezoekers met Do Not Track of Global Privacy Control worden
volledig overgeslagen.

**Uitzetten of verhuizen.** Zet in `analytics.js` `provider: "none"` en er gaat
geen enkel verzoek meer het internet op. Liever een kant-en-klare dienst? Zet
`provider: "umami"` en plak in elke pagina vóór `analytics.js`:

```html
<script defer src="https://cloud.umami.is/script.js" data-website-id="JOUW-ID"></script>
```

**Zelf controleren.** Open op je eigen machine een pagina met `?meting=1`
(bijvoorbeeld `http://localhost:8000/index.html?meting=1`): rechtsonder verschijnt
een paneel met elke gebeurtenis die afgaat. In de console geeft
`eliyahGoals.summary()` hetzelfde in cijfers.

## Social preview, pictogrammen en crawlbasis

De social-previewkaarten (1200x630) staan in `og/` en worden met een
hoofdloze browser gegenereerd uit `tools/og-card.html`, zodat ze dezelfde
typografie gebruiken als de site:

```bash
# eenmalig, buiten deze map: npm i puppeteer-core sharp
node -e "const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'<pad naar chrome.exe>',headless:'new'});const pg=await b.newPage();await pg.setViewport({width:1200,height:630});await pg.goto('http://localhost:8000/tools/og-card.html?k=Case&t=Kop&s=Subregel&img=/projects/img/project1.jpg',{waitUntil:'networkidle0'});await pg.evaluate(()=>document.fonts.ready);await pg.screenshot({path:'og/nieuwe-case.png'});await b.close();})()"
```

Pictogrammen vernieuw je op dezelfde manier via `tools/icon.html?s=180`
(apple-touch-icon) en `?s=512` (webmanifest).

## Eigen domein

De site gebruikt nu `https://eliyah2.github.io/eliyah-webdesign` als basis in
`canonical`, `og:url`, `og:image`, het JSON-LD-blok, `sitemap.xml`,
`robots.txt`, `site.webmanifest` en de absolute paden in `404.html`. Gaat de
site naar een eigen domein, vervang die basis dan overal — anders wijzen de
previews en de sitemap nog naar het oude adres.

## Lokaal bekijken

Geen installatie nodig. Open `index.html` in de browser, of start een simpele server:

```bash
python -m http.server 8000
```

Ga daarna naar <http://localhost:8000>.

## Contact

- E-mail: eliyahimpelmans9@gmail.com
- Locatie: Roermond, Nederland
