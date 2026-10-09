/* ============================================================
   Van host wisselen — één commando voor alle absolute URL's
   ------------------------------------------------------------
   De site gebruikt op één plek een vaste basis: canonical, og:url, og:image,
   het JSON-LD-blok, sitemap.xml, robots.txt en site.webmanifest. Gaat de site
   naar een eigen domein, dan moet die basis overal mee.

   Gebruik:
     node tools/switch-host.js https://jouwdomein.nl
     node tools/switch-host.js https://jouwdomein.nl --droog    (alleen tonen)

   Wat het niet doet: 404.html aanpassen (dat rekent zelf het juiste pad uit)
   en de meting. Vergeet niet het nieuwe adres daar toe te voegen
   (ALLOWED_ORIGINS), anders stopt de meting stil.
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASIS = "https://eliyah-webdesign.vercel.app"; // de huidige basis
const EXTENSIES = [".html", ".xml", ".txt", ".json", ".webmanifest", ".md", ".js", ".css"];
const OVERSLAAN = new Set([".git", ".freebuff", "node_modules", "tools", "meting"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (OVERSLAAN.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (EXTENSIES.includes(path.extname(entry.name))) out.push(p);
  }
  return out;
}

const nieuw = (process.argv[2] || "").replace(/\/+$/, "");
const droog = process.argv.includes("--droog");

if (!/^https:\/\/[^/]+$/.test(nieuw)) {
  console.error("Geef één kale https-basis mee, bijvoorbeeld: https://jouwdomein.nl");
  process.exit(1);
}

let bestanden = 0;
let treffers = 0;
for (const full of walk(ROOT)) {
  let raw = fs.readFileSync(full, "utf8");
  if (!raw.includes(BASIS)) continue;
  const aantal = raw.split(BASIS).length - 1;
  const rel = path.relative(ROOT, full).replace(/\\/g, "/");
  console.log(`${droog ? "zou wijzigen" : "gewijzigd"}  ${rel}: ${aantal} verwijzing(en)`);
  if (!droog) fs.writeFileSync(full, raw.split(BASIS).join(nieuw));
  bestanden++;
  treffers += aantal;
}

console.log(`\n${treffers} verwijzingen in ${bestanden} bestanden${droog ? " (droogloop: niets geschreven)" : ""}`);
console.log(`Nieuwe basis: ${nieuw}`);
console.log("Vergeet hierna niet: de meting (ALLOWED_ORIGINS) en, bij volledige overstap, GitHub Pages uitzetten.");
