# Eliyah Webdesign — portfolio

Portfolio van **Eliyah Impelmans**, webdesigner & developer uit Roermond.
Gebouwd met vanilla HTML, CSS en JavaScript — geen frameworks, geen build-stap.

## Kenmerken

- **High-end uitstraling** — donker design system met aurora-achtergrond, filmgrain en glaswerk
- **Licht & donker thema** — schakelbaar, keuze wordt onthouden en volgt anders de systeemvoorkeur
- **Micro-interacties** — scroll-reveals, 3D-tilt, magnetische knoppen, custom cursor (alleen desktop)
- **Volledig responsive** — van 320px tot breedbeeld, met een eigen mobiel menu
- **Toegankelijk** — semantische HTML, toetsenbordnavigatie, focus-states en `prefers-reduced-motion`
- **Snel** — geen externe libraries, lazy-loading afbeeldingen, geen overbodige requests

## Structuur

```
.
├── index.html            # Homepage (hero, diensten, werkwijze, projecten,
│                         # pakketten, maandelijkse onderhoudspakketten, FAQ, contact)
├── style.css             # Design system + alle componenten
├── script.js             # Interactie (thema, cursor, reveals, tellers, filter, formulier)
├── logo.svg              # Logo
└── projects/
    ├── glanzza.html      # Case: boekingsplatform met Wero-aanbetaling
    ├── menuapp.html      # Case: tafelbestelsysteem Las Tapas
    ├── hairshop.html     # Case: website John's Hairshop (live)
    ├── funforest.html    # Case: FunForest Seizoenskaart (mobiele app)
    ├── greenhouse.html   # Case: kas-dashboard
    ├── widgets.html      # Case: UI-widgets
    ├── funkyfries.html   # Case: restaurantwebsite
    ├── style.css         # Aanvullende projectpagina-styling
    └── img/              # Beelden per project
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

## Aanpassen

**WhatsApp aanzetten.** Zet je nummer één keer in `script.js` bij
`WHATSAPP_NUMBER` (landcode zonder `+` of `00`, bijvoorbeeld `31612345678`).
Dan verschijnen automatisch de WhatsApp-links in de contactlijst, bij het
contactformulier en in de footer. Laat je het leeg, dan blijven die knoppen
verborgen in plaats van dat er een dode link op de site staat.

**Resultaat per project.** Elke projectkaart heeft een regel
`<p class="project__result">` met de opbrengst van dat project. Vervang die
tekst door een echt cijfer of een quote zodra je die hebt — dat overtuigt
meer dan een beschrijving.

**Toegankelijkheid.** Elke pagina begint met een skip-link naar de inhoud,
heeft `tabindex="-1"` op de hoofdinhoud en verstuurt formulieren met
`autocomplete` zodat browsers en wachtwoordmanagers kunnen invullen.

## Lokaal bekijken

Geen installatie nodig. Open `index.html` in de browser, of start een simpele server:

```bash
python -m http.server 8000
```

Ga daarna naar <http://localhost:8000>.

## Contact

- E-mail: eliyahimpelmans9@gmail.com
- Instagram: [@eliyah.0475](https://instagram.com/eliyah.0475)
- Locatie: Roermond, Nederland
