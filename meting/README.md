# Verzamelpunt van de doelmeting

Deze map hoort **niet** bij de website zelf. Het is het kleine Worker-script dat de
gebeurtenissen van `analytics.js` opvangt en bewaart, plus het besloten dashboard
waarop Eliyah ze leest.

## Routes

| Route | Wat het doet | Wie mag het |
| --- | --- | --- |
| `POST /collect` | gebeurtenis opslaan (max 2 kB, alleen bekende namen) | alleen browsers van de eigen site (Origin-controle) |
| `GET /stats?token=…` | dashboard met de cijfers | alleen met het juiste token |
| `GET /stats.json?token=…` | dezelfde cijfers als JSON (`&dagen=7\|30\|90`) | alleen met het juiste token |
| `POST /leegmaken?token=…&bevestig=ja` | alle rijen wissen (`&ouderdan=90` wist alleen oudere) | alleen met het juiste token |
| `GET /robots.txt` | sluit het hele domein voor zoekmachines | openbaar |

Zonder (juist) token antwoordt het dashboard **404** — het bestaat dan niet, ook
niet voor wie het adres raadt.

## Wat er in de database staat

Alleen: `name` (welke gebeurtenis), `label` (welke knop of case), `section`
(welk deel van de pagina), `page`, `day` en `ts`. Bewust **niet**: IP-adressen,
user-agents, cookies, bezoekers-ID's of formulierinhoud. Daardoor is er geen
cookiebanner nodig en is de meting niet tot personen te herleiden.

## Instellingen

| Variabele | Soort | Betekenis |
| --- | --- | --- |
| `DB` | D1-binding | de database met de gebeurtenissen |
| `STATS_TOKEN` | geheim | wachtwoord voor het dashboard (staat buiten de repo) |
| `ALLOWED_ORIGINS` | variabele (optioneel) | extra toegestane adressen, komma-gescheiden, `*` als achtervoegsel mag |

Standaard zijn dit de toegestane afzenders: `eliyah2.github.io`,
`eliyah-webdesign.vercel.app`, alle `eliyah-webdesign-*.vercel.app`-previews en
`localhost`/`127.0.0.1` voor lokaal testen. Komt er een eigen domein bij, zet dat
dan in `ALLOWED_ORIGINS`, anders telt die site niet mee.

## Opnieuw uitrollen

`manifest.json` in deze map is de deployment. Na een wijziging in `worker.js`
opnieuw uitrollen (`sites_deploy` met dit manifest); de D1-binding en het token
blijven daarbij staan.
