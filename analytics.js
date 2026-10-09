/* ============================================================
   ELIYAH WEBDESIGN — cookieloze doelmeting
   ------------------------------------------------------------
   Wat dit bestand doet:
   - Het telt de klikken die geld opleveren: WhatsApp, "Kennismaken"
     (elke knop die naar #contact wijst), e-mail, de case-kaarten en het
     contactformulier (start, fout, verzonden).
   - Het stuurt die gebeurtenissen naar één provider die jij kiest.
     Staat de provider op "none", dan wordt er NIETS verstuurd — er gaat
     geen enkel verzoek het internet op. Zetten is dus jouw keuze.

   Privacy (bewust zo gebouwd):
   - Geen cookies, geen localStorage, geen bezoekers-ID, geen vingerafdruk.
   - Geen inhoud van het formulier: alleen dát er verzonden is en welke
     keuzelijst-optie er stond (bijv. "Webshop"). Nooit naam, e-mail of bericht.
   - Bezoekers met "Do Not Track" of Global Privacy Control worden volledig
     overgeslagen (zie respectDnt hieronder).

   Aanzetten (kies er één):
     Umami Cloud (gratis tier, cookieless) →
       1. maak een account op https://cloud.umami.is en voeg je site toe
       2. plak in elke pagina, vóór analytics.js:
          <script defer src="https://cloud.umami.is/script.js" data-website-id="JOUW-ID"></script>
       3. zet hieronder provider op "umami"
     Eigen verzamelpunt (bijv. een Vercel- of Cloudflare-functie) →
       provider op "endpoint" en endpoint op de volledige URL.
     Niets meten → laat provider op "none" staan.

   Controleren of het werkt:
     Open een pagina met ?meting=1 achter de URL (bijv. index.html?meting=1).
     Rechtsonder verschijnt een paneel met elke gebeurtenis die afgaat.
     In de console: eliyahGoals.events  ·  eliyahGoals.summary()
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Instellingen: alleen dit blok hoef je aan te passen ---------- */
  var CONFIG = {
    provider: "none", // "none" | "umami" | "plausible" | "endpoint"
    endpoint: "", // volledige URL, alleen bij provider "endpoint"
    debug: false, // true = altijd het meetpaneel; ?meting=1 werkt ook
    respectDnt: true, // bezoekers met Do Not Track / GPC overslaan
    sampleRate: 1 // 1 = alles meten, 0.5 = de helft (voor drukke sites)
  };

  // Testhaak: laat een pagina (of een testbestand) de instellingen tijdelijk
  // overschrijven zonder dit bestand te wijzigen.
  if (window.ELIYAH_GOALS_CONFIG) {
    for (var key in window.ELIYAH_GOALS_CONFIG) {
      if (Object.prototype.hasOwnProperty.call(window.ELIYAH_GOALS_CONFIG, key)) {
        CONFIG[key] = window.ELIYAH_GOALS_CONFIG[key];
      }
    }
  }

  var params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch (e) {
    params = null;
  }
  var showPanel = CONFIG.debug || (params && params.get("meting") === "1");

  /* ---------- Uitval: respecteer de keuze van de bezoeker ---------- */
  var dnt =
    navigator.doNotTrack === "1" ||
    navigator.doNotTrack === "yes" ||
    window.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1";
  var gpc = navigator.globalPrivacyControl === true;
  var optedOut = CONFIG.respectDnt && (dnt || gpc);

  /* ---------- Interne toestand ---------- */
  var events = []; // alles wat deze pagina heeft gezien
  var queue = []; // wacht op verzending
  var sent = 0;
  var skipped = optedOut ? "opt-out (Do Not Track of Global Privacy Control)" : 0;
  var drops = 0;
  var retries = 0;
  var retryTimer = null;

  function nowIso() {
    try {
      return new Date().toISOString();
    } catch (e) {
      return "";
    }
  }

  function pagePath() {
    var p = window.location.pathname || "/";
    var base = p.split("/").pop() || "index.html";
    return base;
  }

  /* ---------- Verzenden ---------- */
  function providerReady() {
    if (CONFIG.provider === "umami") return !!(window.umami && window.umami.track);
    if (CONFIG.provider === "plausible") return typeof window.plausible === "function";
    if (CONFIG.provider === "endpoint") return !!CONFIG.endpoint;
    return false;
  }

  function sendOne(item) {
    var provider = CONFIG.provider;
    if (provider === "umami") {
      window.umami.track(item.name, item.props);
      return true;
    }
    if (provider === "plausible") {
      window.plausible(item.name, { props: item.props });
      return true;
    }
    if (provider === "endpoint") {
      var body = JSON.stringify({
        event: item.name,
        props: item.props,
        page: pagePath(),
        time: nowIso()
      });
      // sendBeacon overleeft het sluiten van de pagina en werkt zonder CORS-preflight
      if (navigator.sendBeacon) {
        var blob = null;
        try {
          blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        } catch (e) {
          blob = null;
        }
        if (navigator.sendBeacon(CONFIG.endpoint, blob || body)) return true;
      }
      if (window.fetch) {
        window
          .fetch(CONFIG.endpoint, {
            method: "POST",
            keepalive: true,
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: body
          })
          .catch(function () {});
        return true;
      }
      return false;
    }
    return false;
  }

  function flush() {
    if (optedOut || CONFIG.provider === "none" || !queue.length) return;

    if (!providerReady()) {
      // Provider-script is nog niet geladen: even wachten en opnieuw proberen.
      if (retries < 4 && !retryTimer) {
        retries++;
        retryTimer = window.setTimeout(function () {
          retryTimer = null;
          flush();
        }, 600 * retries);
      } else {
        drops += queue.length;
        queue.length = 0;
      }
      return;
    }

    var batch = queue.slice();
    queue.length = 0;
    for (var i = 0; i < batch.length; i++) {
      if (sendOne(batch[i])) sent++;
      else {
        drops++;
      }
    }
  }

  /* ---------- De kern ---------- */
  function track(name, props) {
    if (optedOut) return;
    if (CONFIG.sampleRate < 1 && Math.random() > CONFIG.sampleRate) return;

    var clean = {};
    for (var key in props || {}) {
      if (props[key] !== undefined && props[key] !== null && props[key] !== "") clean[key] = props[key];
    }

    var item = { name: name, props: clean, page: pagePath(), time: nowIso() };
    events.push(item);
    queue.push(item);

    // Andere scripts (of jij in de console) kunnen meelezen zonder de provider te kennen
    try {
      document.dispatchEvent(new CustomEvent("eliyah:goal", { detail: item }));
    } catch (e) {}

    if (showPanel) drawPanel();
    flush();
  }

  /* ---------- Hulpjes voor labels ---------- */
  function labelOf(el) {
    var text = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
    return text.slice(0, 48);
  }

  // In welke sectie stond de klik? Dat maakt de cijfers bruikbaar:
  // "de hero-knop werkt wel, de pakketten-knop niet" is een actie, "er is
  // 4x geklikt" niet.
  function sectionOf(el) {
    var node = el;
    var fallback = "";
    while (node && node !== document.body) {
      if (node.tagName === "SECTION") {
        if (node.id) return node.id;
        var cls = String(node.className || "").split(/\s+/)[0];
        return (cls && cls !== "section" ? cls : fallback || "sectie").slice(0, 32);
      }
      if (!fallback && node.id) fallback = node.id;
      node = node.parentElement;
    }
    if (fallback) return fallback;
    if (el.closest && el.closest("header")) return "header";
    if (el.closest && el.closest("footer")) return "footer";
    return "";
  }

  function isContactIntent(href) {
    if (!href) return false;
    if (href.indexOf("mailto:") === 0) return false;
    return /#contact$/.test(href.replace(/\/$/, "")) || href === "#contact";
  }

  /* ---------- Wat er gemeten wordt ---------- */
  function bindGoals() {
    var formStarted = false;

    document.addEventListener(
      "click",
      function (e) {
        var el = e.target.closest ? e.target.closest("a, button") : null;
        if (!el) return;

        // 1. WhatsApp
        if (el.hasAttribute("data-whatsapp") || (el.getAttribute("href") || "").indexOf("wa.me") > -1) {
          track("whatsapp_click", { label: labelOf(el), section: sectionOf(el) });
          return;
        }

        var href = el.getAttribute("href") || "";

        // 2. Elke knop die naar het contactformulier leidt = "Kennismaken"
        if (isContactIntent(href)) {
          track("kennismaken_click", { label: labelOf(el), section: sectionOf(el) });
          return;
        }

        // 3. E-mail
        if (href.indexOf("mailto:") === 0) {
          track("email_click", { label: labelOf(el), section: sectionOf(el) });
          return;
        }

        // 4. Bellen (voor als er later een telefoonnummer bij komt)
        if (href.indexOf("tel:") === 0) {
          track("call_click", { label: labelOf(el), section: sectionOf(el) });
          return;
        }

        // 5. Case openen vanuit het portfolio
        var card = el.closest ? el.closest(".project") : null;
        if (card) {
          var title = card.querySelector("h3");
          track("case_open", {
            label: (title ? title.textContent : labelOf(el)).replace(/\s+/g, " ").trim().slice(0, 48),
            section: "projecten"
          });
          return;
        }

        // 6. Externe links (GitHub, live sites van klanten)
        if (/^https?:\/\//.test(href) && el.hostname && el.hostname !== window.location.hostname) {
          track("outbound_click", { label: el.hostname, section: sectionOf(el) });
        }
      },
      true
    );

    // Formulier: start, fout, verzonden.
    // De geldigheid wordt bijgehouden tijdens het typen, zodat de meting niet
    // afhankelijk is van de volgorde waarin scripts hun submit-listener zetten
    // (script.js leegt het formulier namelijk meteen na een geldige submit).
    var form = document.getElementById("contactForm");
    if (form) {
      var state = { valid: false, subject: "" };
      var fields = {
        name: document.getElementById("name"),
        mail: document.getElementById("email"),
        message: document.getElementById("message"),
        subject: document.getElementById("subject")
      };

      var liveValid = function () {
        return !!(
          fields.name &&
          fields.mail &&
          fields.message &&
          fields.name.value.trim() &&
          fields.message.value.trim() &&
          /^\S+@\S+\.\S+$/.test(fields.mail.value)
        );
      };

      var snapshot = function () {
        state.valid = liveValid();
        state.subject = fields.subject ? fields.subject.value : "";
      };

      ["input", "change", "focusin"].forEach(function (type) {
        form.addEventListener(type, function () {
          snapshot();
          if (type === "focusin") {
            if (formStarted) return;
            formStarted = true;
            track("form_start", { section: "contact" });
          }
        });
      });

      snapshot();

      form.addEventListener("submit", function () {
        // Let op: géén naam, e-mail of berichttekst — alleen de categorie.
        if (state.valid || liveValid()) {
          track("form_submit", { section: "contact", label: state.subject });
        } else {
          track("form_error", { section: "contact", label: "validatie" });
        }
      });
    }

    // Bezoek per pagina (voor het eigen verzamelpunt; Umami en Plausible
    // tellen paginaweergaven zelf al)
    if (CONFIG.provider === "endpoint") {
      track("pageview", { label: document.title.slice(0, 60) });
    }
  }

  /* ---------- Meetpaneel (?meting=1) ---------- */
  var panel = null;
  function drawPanel() {
    if (!panel) {
      panel = document.createElement("div");
      panel.setAttribute("role", "log");
      panel.setAttribute("aria-label", "Meetpaneel doelen");
      panel.style.cssText =
        "position:fixed;right:12px;bottom:12px;z-index:9999;max-width:min(340px,90vw);" +
        "padding:12px 14px;border-radius:14px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;" +
        "background:rgba(10,10,16,.92);color:#eaeaf2;border:1px solid rgba(255,255,255,.18);" +
        "box-shadow:0 12px 40px rgba(0,0,0,.45);backdrop-filter:blur(8px)";
      panel.addEventListener("click", function () {
        events.length = 0;
        drawPanel();
      });
      document.body.appendChild(panel);
    }

    var counts = {};
    events.forEach(function (item) {
      var key = item.name + (item.props && item.props.label ? " · " + item.props.label : "");
      counts[key] = (counts[key] || 0) + 1;
    });

    var lines = Object.keys(counts).map(function (key) {
      return "&nbsp;&nbsp;" + counts[key] + "× " + escapeHtml(key);
    });

    panel.innerHTML =
      "<strong>Doelmeting</strong> — provider: " +
      escapeHtml(CONFIG.provider) +
      (CONFIG.provider === "none" ? " <em>(er wordt niets verstuurd)</em>" : "") +
      "<br>" +
      (lines.length ? lines.join("<br>") : "&nbsp;&nbsp;<em>nog geen klikken gezien</em>") +
      (skipped ? "<br>&nbsp;&nbsp;<em>overgeslagen: " + escapeHtml(String(skipped)) + "</em>" : "") +
      "<br>&nbsp;&nbsp;<em>tik om te wissen · alleen zichtbaar voor jou</em>";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- Start ---------- */
  function boot() {
    bindGoals();
    flush();
    if (showPanel) drawPanel();
  }

  window.eliyahGoals = {
    config: CONFIG,
    events: events,
    summary: function () {
      var counts = {};
      events.forEach(function (item) {
        counts[item.name] = (counts[item.name] || 0) + 1;
      });
      return { provider: CONFIG.provider, sent: sent, dropped: drops, skipped: skipped, counts: counts, events: events };
    },
    track: track,
    flush: flush
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
