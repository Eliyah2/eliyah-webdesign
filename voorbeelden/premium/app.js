/* Eén klein script voor het Premium-voorbeeld: de rekenhulp op de homepage en de
   tabbladen plus demo-acties in het klantportaal. Alles is voorbeeldgedrag zonder
   server: er wordt niets verstuurd en niets opgeslagen. */
(function () {
  "use strict";

  var geld = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  /* ---------- Rekenhulp ---------- */
  var SOORTEN = {
    aanbouw: { perM2: 1180, weken: 9, label: "Aanbouw of uitbouw" },
    badkamer: { perM2: 640, weken: 3, label: "Badkamerrenovatie" },
    verbouwing: { perM2: 520, weken: 11, label: "Verbouwing" },
    interieur: { perM2: 430, weken: 7, label: "Interieur op maat" },
  };
  var AFWERKING = {
    basis: { factor: 1, label: "Basis" },
    comfort: { factor: 1.16, label: "Comfort" },
    luxe: { factor: 1.38, label: "Luxe" },
  };

  var config = document.getElementById("bedrag");
  if (config) {
    var staat = { soort: "aanbouw", afwerking: "comfort", meters: 22, extras: [] };
    var bedragEl = document.getElementById("bedrag");
    var doorloopEl = document.getElementById("doorloop");
    var lijstEl = document.getElementById("opsomming");
    var uitlegEl = document.getElementById("rekenuitleg");
    var metersUit = document.getElementById("meters-uit");

    function knopGroep(id, sleutel) {
      var groep = document.getElementById(id);
      if (!groep) return;
      groep.addEventListener("click", function (e) {
        var knop = e.target.closest("button");
        if (!knop) return;
        if (sleutel === "extra") {
          var aan = knop.getAttribute("aria-pressed") !== "true";
          knop.setAttribute("aria-pressed", String(aan));
          if (aan) staat.extras.push({ bedrag: Number(knop.dataset.extra), label: knop.dataset.label });
          else staat.extras = staat.extras.filter(function (x) { return x.label !== knop.dataset.label; });
        } else {
          groep.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          knop.setAttribute("aria-pressed", "true");
          staat[sleutel] = knop.dataset[sleutel];
        }
        reken();
      });
    }

    function reken() {
      var soort = SOORTEN[staat.soort];
      var afwerking = AFWERKING[staat.afwerking];
      var basis = staat.meters * soort.perM2 * afwerking.factor;
      var extraBedrag = staat.extras.reduce(function (som, x) { return som + x.bedrag; }, 0);
      var midden = basis + extraBedrag;
      var laag = Math.round((midden * 0.9) / 100) * 100;
      var hoog = Math.round((midden * 1.12) / 100) * 100;
      var weken = soort.weken + Math.round(staat.meters / 30) + staat.extras.length;

      bedragEl.innerHTML = geld.format(laag) + " – " + geld.format(hoog) + " <small>exclusief btw</small>";
      doorloopEl.textContent = "Doorlooptijd: ongeveer " + weken + " weken van start tot oplevering";
      if (metersUit) metersUit.textContent = staat.meters + " m²";

      var regels = [soort.label + " van " + staat.meters + " m², afwerking " + afwerking.label.toLowerCase()];
      staat.extras.forEach(function (x) { regels.push(x.label + " · " + geld.format(x.bedrag)); });
      lijstEl.innerHTML = regels.map(function (r) { return "<li>" + r + "</li>"; }).join("");
      uitlegEl.textContent = "Indicatie op basis van " + geld.format(Math.round(soort.perM2 * afwerking.factor)) + " per m². De exacte prijs volgt na de opname en staat dan vast.";
    }

    knopGroep("soort-knoppen", "soort");
    knopGroep("afwerking-knoppen", "afwerking");
    knopGroep("extra-knoppen", "extra");

    var meters = document.getElementById("meters");
    if (meters) meters.addEventListener("input", function () { staat.meters = Number(meters.value); reken(); });
    reken();
  }

  /* ---------- Klantportaal ---------- */
  var tabs = document.querySelectorAll('[role="tab"]');
  if (tabs.length) {
    function kies(tab) {
      tabs.forEach(function (t) {
        var gekozen = t === tab;
        t.setAttribute("aria-selected", String(gekozen));
        var vlak = document.getElementById(t.getAttribute("aria-controls"));
        if (vlak) vlak.hidden = !gekozen;
      });
      tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { kies(t); });
      t.addEventListener("keydown", function (e) {
        var pijl = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!pijl) return;
        e.preventDefault();
        kies(tabs[(i + pijl + tabs.length) % tabs.length]);
      });
    });
  }

  // Documenten: in deze demo wordt er niets gedownload, maar de knop reageert wel.
  document.querySelectorAll("[data-demo]").forEach(function (knop) {
    knop.addEventListener("click", function () {
      var melding = document.getElementById("demo-document");
      if (!melding) return;
      melding.hidden = false;
      melding.textContent = "In deze demo wordt niets gedownload; in het echte portaal opent hier het document.";
    });
  });

  // Berichten: de regel komt in de lijst te staan zodat het portaal echt aanvoelt.
  var berichtForm = document.getElementById("bericht-form");
  if (berichtForm) {
    berichtForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var invoer = document.getElementById("bericht-invoer");
      var tekst = invoer.value.trim();
      if (tekst.length < 2) return;
      var lijst = document.getElementById("berichtenlijst");
      var blok = document.createElement("div");
      blok.className = "bericht bericht--klant";
      var kop = document.createElement("b");
      kop.textContent = "Familie Hendrix · zojuist";
      blok.appendChild(kop);
      blok.appendChild(document.createTextNode(tekst));
      lijst.appendChild(blok);
      invoer.value = "";
      var melding = document.getElementById("demo-bericht");
      melding.hidden = false;
      melding.textContent = "Dit bericht staat alleen in jouw browser: de demo heeft geen server.";
    });
  }
})();
