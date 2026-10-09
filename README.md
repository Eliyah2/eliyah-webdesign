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
    ├── greenhouse.html   # Case: kas-dashboard
    ├── widgets.html      # Case: UI-widgets
    ├── funkyfries.html   # Case: restaurantwebsite
    ├── style.css         # Aanvullende projectpagina-styling
    └── img/              # Projectafbeeldingen
```

## Diensten & pakketten

| Eenmalig | Prijs | Maandelijks onderhoud | Prijs |
| --- | --- | --- | --- |
| Starter — one-pager | €175 | Zorg Basis | €29 p/m |
| Business — 3–5 pagina's | €350 | Zorg Groei | €59 p/m |
| Premium — maatwerk, shop of dashboard | vanaf €650 | Zorg Zorgeloos | €99 p/m |

Onderhoudspakketten zijn maandelijks opzegbaar: updates, back-ups, monitoring
en support. Losse aanpassing zonder pakket: €45 per uur.

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
