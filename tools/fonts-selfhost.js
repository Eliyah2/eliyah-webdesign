/* ============================================================
   LETTERTYPEN ZELF HOSTEN
   ------------------------------------------------------------
   Haalt Inter (variabel, 100-900) en Instrument Serif op bij Google
   Fonts, zet ze als bestand in fonts/ en schrijft het @font-face-blok
   in style.css opnieuw tussen de markers @fonts:begin en @fonts:eind.

   Gebruik:  node tools/fonts-selfhost.js

   Waarom zelf hosten?
   - Geen verbinding naar fonts.googleapis.com en fonts.gstatic.com meer.
     Dat scheelt twee DNS- en TLS-rondjes voordat de eerste letter staat.
   - Eén variabel Inter-bestand dekt alle gewichten; losse gewichten waren
     samen ruim 230 KB, dit is 47 KB.
   - Er gaat geen enkel verzoek van een bezoeker naar Google.
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FONTMAP = path.join(ROOT, "fonts");
const STYLE = path.join(ROOT, "style.css");
const BEGIN = "/* @fonts:begin */";
const EIND = "/* @fonts:eind */";

// Chrome als user-agent: dan levert Google de moderne woff2-varianten.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const BRON =
  "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Instrument+Serif:ital@0;1&display=swap";

// Alleen deze twee tekensets: de site is Nederlands (latin) met ruimte voor
// accenten (latin-ext). De overige sets (cyrillisch, Grieks, Vietnamees) laten
// we weg; die werden nooit geladen en zouden alleen de map vullen.
function subsetVan(bereik) {
  if (bereik.startsWith("U+0000-00FF")) return "latin";
  if (/^U\+0100-02/.test(bereik)) return "latin-ext";
  return null;
}

function bestandsnaam(familie, stijl) {
  if (familie === "Inter") return "inter-variabel";
  if (familie === "Instrument Serif") return stijl === "italic" ? "instrument-serif-italic" : "instrument-serif-regular";
  return familie.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

(async () => {
  const css = await (await fetch(BRON, { headers: { "User-Agent": UA } })).text();
  if (!css.includes("@font-face")) throw new Error("Google gaf geen @font-face-blokken terug");

  fs.mkdirSync(FONTMAP, { recursive: true });

  const blokken = css.split("@font-face").slice(1);
  const regels = [];
  const gedownload = [];
  const gezien = new Set();

  for (const blok of blokken) {
    const pak = (re) => (blok.match(re) || [])[1];
    const familie = (pak(/font-family:\s*'([^']+)'/) || "").trim();
    const gewicht = (pak(/font-weight:\s*([^;]+);/) || "").trim();
    const stijl = (pak(/font-style:\s*([^;]+);/) || "").trim();
    const bereik = (pak(/unicode-range:\s*([^;]+);/) || "").trim();
    const url = pak(/url\((https:[^)]+)\)/);
    const subset = subsetVan(bereik);
    if (!familie || !url || !subset) continue;

    const naam = bestandsnaam(familie, stijl);
    const bestand = `${naam}-${subset}.woff2`;
    if (gezien.has(bestand)) throw new Error(`dubbel bestand: ${bestand}`);
    gezien.add(bestand);

    const antwoord = await fetch(url, { headers: { "User-Agent": UA } });
    if (!antwoord.ok) throw new Error(`${bestand}: download mislukt (${antwoord.status})`);
    const bytes = Buffer.from(await antwoord.arrayBuffer());
    fs.writeFileSync(path.join(FONTMAP, bestand), bytes);
    gedownload.push({ bestand, kb: bytes.length / 1024 });

    regels.push(
      "@font-face {" +
        `\n  font-family: "${familie}";` +
        `\n  font-style: ${stijl};` +
        `\n  font-weight: ${gewicht};` +
        "\n  font-display: swap;" +
        `\n  src: url("fonts/${bestand}") format("woff2");` +
        `\n  unicode-range: ${bereik};` +
        "\n}"
    );
  }

  if (!regels.length) throw new Error("geen bruikbare @font-face-regels gevonden");

  let style = fs.readFileSync(STYLE, "utf8");
  // Zelfde regeleindes gebruiken als de rest van het bestand.
  const regeleinde = style.includes("\r\n") ? "\r\n" : "\n";
  const blokTekst = [BEGIN, ...regels, EIND].join("\n");
  const nieuw = blokTekst.split("\n").join(regeleinde);

  if (style.includes(BEGIN) && style.includes(EIND)) {
    const van = style.indexOf(BEGIN);
    const tot = style.indexOf(EIND) + EIND.length;
    style = style.slice(0, van) + nieuw + style.slice(tot);
  } else {
    // Nog geen blok: direct na de kop van het bestand zetten.
    const kop = style.indexOf("*/");
    if (kop === -1) throw new Error("geen kop gevonden in style.css");
    const invoeg = kop + 2;
    style = style.slice(0, invoeg) + regeleinde + regeleinde + nieuw + style.slice(invoeg);
  }
  fs.writeFileSync(STYLE, style);

  const totaal = gedownload.reduce((som, b) => som + b.kb, 0);
  console.log("opgehaald en geplaatst in fonts/:");
  for (const b of gedownload) console.log(`  ${b.bestand.padEnd(42)} ${b.kb.toFixed(1)} KB`);
  console.log(`  ${"totaal".padEnd(42)} ${totaal.toFixed(1)} KB`);
  console.log(`\n${regels.length} @font-face-regels in style.css bijgewerkt tussen ${BEGIN} en ${EIND}.`);
})().catch((fout) => {
  console.error("FOUT:", fout.message);
  process.exit(1);
});
