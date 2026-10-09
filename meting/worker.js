/* ============================================================
   ELIYAH WEBDESIGN — verzamelpunt voor de doelmeting
   ------------------------------------------------------------
   Dit is géén onderdeel van de website. Het is een klein Worker-script dat
   de gebeurtenissen van analytics.js opvangt en bewaart in een D1-database,
   plus een besloten dashboard waarop je ze kunt lezen.

   Routes:
     POST /collect          gebeurtenis opslaan (openbaar, dat moet van de browser komen)
     GET  /stats?token=...  dashboard met de cijfers (alleen met het juiste token)
     GET  /stats.json?...   dezelfde cijfers als JSON

   Wat er NIET in de database komt: geen IP-adressen, geen user-agents, geen
   cookies, geen bezoekers-ID's, geen formulierinhoud. Alleen: welke
   gebeurtenis, welk label, welke sectie, welke pagina en wanneer.
   ============================================================ */

const TOEGESTANE_EVENTS = new Set([
  "pageview",
  "kennismaken_click",
  "whatsapp_click",
  "email_click",
  "call_click",
  "case_open",
  "outbound_click",
  "form_start",
  "form_submit",
  "form_error",
  "section_view",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_100",
]);

const MAX_BODY = 2048;

/* Alleen browsers van jóuw eigen site mogen schrijven. De Origin-header wordt
   door de browser zelf gezet en is met pagina-JavaScript niet te vervalsen,
   dus dit houdt rommel van andere sites tegen. Komt er later een eigen domein
   bij, zet dat dan in de variabele ALLOWED_ORIGINS.
   Patronen eindigen op * als het begin moet kloppen (bijv. alle
   Vercel-previewadressen). */
const STANDAARD_ORIGINS = [
  "https://eliyah2.github.io",
  "https://eliyah-webdesign.vercel.app",
  "https://eliyah-webdesign-*",
  "http://localhost:*",
  "http://127.0.0.1:*",
];

// Kopregels voor alles wat met het dashboard te maken heeft: het token staat in
// de URL, dus er mag nooit een verwijzing (Referer) naar buiten lekken en het
// mag nooit in een zoekmachine of iframe belanden.
const VEILIGE_KOPPEN = {
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
};

function originToegestaan(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  const extra = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...STANDAARD_ORIGINS, ...extra].some((patroon) =>
    patroon.endsWith("*") ? origin.startsWith(patroon.slice(0, -1)) : origin === patroon
  );
}

let schemaKlaar = null;
function zorgVoorSchema(db) {
  if (!schemaKlaar) {
    schemaKlaar = db
      .exec(
        "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, label TEXT, section TEXT, page TEXT, day TEXT NOT NULL, ts TEXT NOT NULL)" +
          "; CREATE INDEX IF NOT EXISTS idx_events_day ON events(day)" +
          "; CREATE INDEX IF NOT EXISTS idx_events_name ON events(name)"
      )
      .catch(() => {
        schemaKlaar = null;
      });
  }
  return schemaKlaar;
}

function schoon(waarde, max) {
  if (typeof waarde !== "string") return null;
  const t = waarde.replace(/\s+/g, " ").trim().slice(0, max);
  return t || null;
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

async function verzamel(request, env) {
  // Stil negeren wat niet van de eigen site komt: geen rij, geen informatie.
  if (!originToegestaan(request, env)) return new Response(null, { status: 204, headers: cors() });

  const lengte = Number(request.headers.get("content-length") || 0);
  if (lengte > MAX_BODY) return new Response(null, { status: 413 });

  const ruw = await request.text();
  // Ook zonder content-length header (sommige browsers) hard afkappen:
  // alles wat groter is dan een gebeurtenis hoort hier niet thuis.
  if (ruw.length > MAX_BODY) return new Response(null, { status: 413 });
  const tekst = ruw.trim();
  if (!tekst) return new Response(null, { status: 400 });

  let data;
  try {
    data = JSON.parse(tekst);
  } catch (e) {
    return new Response(null, { status: 400 });
  }

  const naam = schoon(data && data.event, 40);
  if (!naam || !TOEGESTANE_EVENTS.has(naam)) return new Response(null, { status: 204 });

  const props = (data && data.props) || {};
  const nu = new Date();
  const ts = nu.toISOString();
  const day = ts.slice(0, 10);

  await zorgVoorSchema(env.DB);
  await env.DB.prepare(
    "INSERT INTO events (name, label, section, page, day, ts) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(naam, schoon(props.label, 60), schoon(props.section, 32), schoon(data.page, 64), day, ts)
    .run();

  return new Response(null, { status: 204, headers: cors() });
}

function veiligGelijk(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return verschil === 0;
}

const KLIK_EVENTS = [
  "kennismaken_click",
  "whatsapp_click",
  "email_click",
  "call_click",
  "case_open",
  "outbound_click",
  "form_submit",
  "form_error",
];

async function cijfers(env, dagen) {
  const vanaf = new Date(Date.now() - (dagen - 1) * 86400000).toISOString().slice(0, 10);
  const db = env.DB;
  await zorgVoorSchema(db);

  const alles = await db
    .prepare("SELECT name, label, section, page, day, ts FROM events WHERE day >= ?")
    .bind(vanaf)
    .all();

  const rijen = (alles.results || []).filter((r) => r.ts);
  const tel = (filter, sleutel) => {
    const m = new Map();
    rijen.filter(filter).forEach((r) => {
      const k = r[sleutel] || "(leeg)";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].map(([naam, aantal]) => ({ naam, aantal })).sort((a, b) => b.aantal - a.aantal);
  };

  const perDagMap = new Map();
  rijen
    .filter((r) => r.name === "pageview")
    .forEach((r) => perDagMap.set(r.day, (perDagMap.get(r.day) || 0) + 1));
  const perDag = [...perDagMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([dag, aantal]) => ({ dag, aantal }));

  const laatste = (await db.prepare("SELECT name, label, section, page, ts FROM events ORDER BY id DESC LIMIT 30").all()).results || [];

  return {
    dagen,
    vanaf,
    totaal: rijen.length,
    bezoeken: rijen.filter((r) => r.name === "pageview").length,
    kliks: rijen.filter((r) => KLIK_EVENTS.includes(r.name)).length,
    formulieren: rijen.filter((r) => r.name === "form_submit").length,
    gebeurtenissen: tel(() => true, "name"),
    paginas: tel((r) => r.name === "pageview", "page"),
    secties: tel((r) => r.name === "section_view", "section"),
    knoppen: tel((r) => KLIK_EVENTS.includes(r.name), "label"),
    scroll: tel((r) => r.name.startsWith("scroll_"), "name"),
    perDag,
    laatste,
  };
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const htmlVeilig = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ESC[c]);

function balk(lijst, max) {
  return lijst
    .slice(0, 12)
    .map((r) => {
      const breedte = max ? Math.max(2, Math.round((r.aantal / max) * 100)) : 2;
      return `<div class="rij"><span class="naam">${htmlVeilig(r.naam)}</span><span class="balk"><i style="width:${breedte}%"></i></span><b>${r.aantal}</b></div>`;
    })
    .join("");
}

function dashboard(data, token) {
  const maxPagina = Math.max(1, ...data.paginas.map((r) => r.aantal));
  const maxSectie = Math.max(1, ...data.secties.map((r) => r.aantal));
  const maxKnop = Math.max(1, ...data.knoppen.map((r) => r.aantal));
  const maxDag = Math.max(1, ...data.perDag.map((r) => r.aantal));

  const tabs = [7, 30, 90]
    .map(
      (d) =>
        `<a class="${d === data.dagen ? "aan" : ""}" href="?token=${encodeURIComponent(token)}&dagen=${d}">${d} dagen</a>`
    )
    .join("");

  const dagen = data.perDag
    .slice(-30)
    .map(
      (d) =>
        `<div class="dag" title="${d.dag}: ${d.aantal} bezoeken"><i style="height:${Math.max(3, Math.round((d.aantal / maxDag) * 100))}%"></i><span>${d.dag.slice(8)}</span></div>`
    )
    .join("");

  const laatste = data.laatste
    .map(
      (r) =>
        `<tr><td data-tijd="${htmlVeilig(r.ts)}">${htmlVeilig(r.ts.slice(11, 16))}</td><td><code>${htmlVeilig(r.name)}</code></td><td>${htmlVeilig(r.label || "")}</td><td>${htmlVeilig(r.section || "")}</td><td>${htmlVeilig(r.page || "")}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Meting — Eliyah Webdesign</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 20px 60px; background: #07070b; color: #f4f3f1;
    font: 15px/1.55 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 1040px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 .35rem; letter-spacing: -.02em; }
  .sub { color: #9a9aad; margin: 0 0 1.6rem; font-size: .95rem; }
  .tabs { display: flex; gap: .5rem; margin-bottom: 1.6rem; flex-wrap: wrap; }
  .tabs a { text-decoration: none; color: #c9c9d3; border: 1px solid rgba(255,255,255,.16); padding: .4rem .9rem; border-radius: 99px; font-size: .85rem; }
  .tabs a.aan { background: linear-gradient(120deg,#8aa8ff,#b98cff 55%,#ff9ecb); color: #0a0a12; border-color: transparent; font-weight: 600; }
  .kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .8rem; margin-bottom: 1.8rem; }
  .kpi div { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 1rem 1.1rem; }
  .kpi b { display: block; font-size: 1.7rem; letter-spacing: -.02em; }
  .kpi span { color: #9a9aad; font-size: .82rem; text-transform: uppercase; letter-spacing: .08em; }
  section { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 1.2rem 1.3rem; margin-bottom: 1rem; }
  h2 { font-size: .95rem; text-transform: uppercase; letter-spacing: .1em; color: #b9b9c9; margin: 0 0 1rem; }
  .rij { display: grid; grid-template-columns: minmax(120px, 1.4fr) 3fr auto; gap: .7rem; align-items: center; padding: .28rem 0; font-size: .9rem; }
  .rij .naam { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #e7e7ef; }
  .rij .balk { background: rgba(255,255,255,.07); border-radius: 99px; height: 8px; overflow: hidden; }
  .rij .balk i { display: block; height: 100%; background: linear-gradient(90deg,#8aa8ff,#b98cff); }
  .rij b { font-variant-numeric: tabular-nums; color: #f4f3f1; }
  .dagen { display: flex; align-items: flex-end; gap: 3px; height: 120px; }
  .dag { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; position: relative; }
  .dag i { display: block; width: 100%; border-radius: 4px 4px 0 0; background: linear-gradient(180deg,#b98cff,#8aa8ff); opacity: .85; }
  .dag span { font-size: 9px; color: #6f6f80; text-align: center; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: .85rem; }
  th, td { text-align: left; padding: .35rem .5rem; border-bottom: 1px solid rgba(255,255,255,.07); white-space: nowrap; }
  th { color: #9a9aad; font-weight: 500; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
  code { background: rgba(255,255,255,.07); padding: .1rem .35rem; border-radius: 6px; font-size: .8rem; }
  .leeg { color: #7c7c8d; font-style: italic; }
  footer { color: #6f6f80; font-size: .8rem; margin-top: 1.4rem; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Doelmeting — Eliyah Webdesign</h1>
  <p class="sub">Laatste ${data.dagen} dagen (vanaf ${htmlVeilig(data.vanaf)}) · alleen jouw cijfers, geen cookies en geen bezoekersgegevens.</p>
  <div class="tabs">${tabs}</div>

  <div class="kpi">
    <div><b>${data.bezoeken}</b><span>Paginaweergaven</span></div>
    <div><b>${data.kliks}</b><span>Kliks op doelen</span></div>
    <div><b>${data.formulieren}</b><span>Formulieren verzonden</span></div>
    <div><b>${data.totaal}</b><span>Gebeurtenissen</span></div>
  </div>

  <section>
    <h2>Bezoeken per dag</h2>
    ${data.perDag.length ? `<div class="dagen">${dagen}</div>` : `<p class="leeg">Nog geen bezoeken in deze periode.</p>`}
  </section>

  <section>
    <h2>Meest bekeken pagina's</h2>
    ${data.paginas.length ? balk(data.paginas, maxPagina) : `<p class="leeg">Nog niets.</p>`}
  </section>

  <section>
    <h2>Meest bekeken secties</h2>
    ${data.secties.length ? balk(data.secties, maxSectie) : `<p class="leeg">Nog niets.</p>`}
  </section>

  <section>
    <h2>Waar geklikt wordt</h2>
    ${data.knoppen.length ? balk(data.knoppen, maxKnop) : `<p class="leeg">Nog niets.</p>`}
  </section>

  <section>
    <h2>Hoe ver men leest</h2>
    ${data.scroll.length ? balk(data.scroll, Math.max(1, ...data.scroll.map((r) => r.aantal))) : `<p class="leeg">Nog niets.</p>`}
  </section>

  <section>
    <h2>Alle gebeurtenissen</h2>
    ${data.gebeurtenissen.length ? balk(data.gebeurtenissen, Math.max(1, ...data.gebeurtenissen.map((r) => r.aantal))) : `<p class="leeg">Nog niets.</p>`}
  </section>

  <section>
    <h2>Laatste 30 gebeurtenissen</h2>
    ${data.laatste.length
      ? `<table><thead><tr><th>Tijd</th><th>Gebeurtenis</th><th>Label</th><th>Sectie</th><th>Pagina</th></tr></thead><tbody>${laatste}</tbody></table>`
      : `<p class="leeg">Nog niets.</p>`}
  </section>

  <footer>Deze pagina staat niet in Google en is alleen met jouw token te openen.</footer>
</div>
<script>
  // Tijden in de tabel omzetten naar jouw lokale tijd
  document.querySelectorAll('td[data-tijd]').forEach(function (cel) {
    try {
      var d = new Date(cel.getAttribute('data-tijd'));
      cel.textContent = d.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {}
  });
</script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pad = url.pathname.replace(/\/+$/, "") || "/";

    if (pad === "/collect") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
      if (request.method !== "POST") return new Response(null, { status: 405, headers: cors() });
      try {
        return await verzamel(request, env);
      } catch (e) {
        return new Response(null, { status: 204, headers: cors() });
      }
    }

    if (pad === "/stats" || pad === "/stats.json" || pad === "/leegmaken") {
      const token = url.searchParams.get("token") || "";
      const ingesteld = env.STATS_TOKEN;
      // Zonder ingesteld token is het dashboard gesloten; we verklappen niet eens dat het bestaat.
      if (!ingesteld || !veiligGelijk(token, ingesteld)) {
        return new Response("Niet gevonden", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

      // Alles wissen (bijvoorbeeld na je eigen testrondjes) vraagt een extra bevestiging.
      if (pad === "/leegmaken") {
        if (request.method !== "POST" || url.searchParams.get("bevestig") !== "ja") {
          return new Response('Stuur een POST met ?bevestig=ja om alle metingen te wissen.\n', {
            status: 400,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
        await zorgVoorSchema(env.DB);
        const ouderDan = Number(url.searchParams.get("ouderdan") || 0);
        const uit = ouderDan > 0
          ? await env.DB.prepare("DELETE FROM events WHERE day < ?")
              .bind(new Date(Date.now() - ouderDan * 86400000).toISOString().slice(0, 10))
              .run()
          : await env.DB.prepare("DELETE FROM events").run();
        return new Response(
          (ouderDan > 0 ? "Ouder dan " + ouderDan + " dagen weggegooid: " : "Weggegooid: ") +
            ((uit.meta && uit.meta.changes) || 0) + " rijen\n",
          { headers: { "Content-Type": "text/plain; charset=utf-8", ...VEILIGE_KOPPEN } }
        );
      }
      const dagen = Math.min(365, Math.max(1, Number(url.searchParams.get("dagen") || 30)));
      const data = await cijfers(env, dagen);

      if (pad === "/stats.json") {
        return new Response(JSON.stringify(data, null, 2), {
          headers: { "Content-Type": "application/json; charset=utf-8", ...VEILIGE_KOPPEN },
        });
      }
      return new Response(dashboard(data, token), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'", ...VEILIGE_KOPPEN },
      });
    }

    if (pad === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=3600" },
      });
    }

    if (pad === "/" || pad === "/hallo") {
      return new Response("Verzamelpunt actief. Cijfers staan op /stats (met token).", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return new Response("Niet gevonden", { status: 404 });
  },
};
