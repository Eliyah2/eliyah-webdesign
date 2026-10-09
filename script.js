/* ============================================================
   ELIYAH WEBDESIGN — interactie
   Alles vanilla, geen dependencies. Elke module is defensief:
   ontbreken elementen (bijv. op projectpagina's), dan doet hij niets.
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 1. Preloader ---------- */
  function initLoader() {
    const loader = $("#loader");

    const finish = () => {
      document.body.classList.add("is-ready");
      if (loader) loader.classList.add("is-done");
    };

    // De loader verdwijnt pas als de webfonts klaar zijn (of na 1,2s).
    // Zo ziet niemand de lettertypewissel — de pagina staat er in één keer goed.
    const afterLoad = () => {
      const jobs = [];
      if (document.fonts && document.fonts.load) {
        jobs.push(document.fonts.load('700 1rem "Inter"'));
        jobs.push(document.fonts.load('italic 1rem "Instrument Serif"'));
      }
      const fonts = jobs.length ? Promise.all(jobs).catch(() => {}) : Promise.resolve();
      const timeout = new Promise((resolve) => setTimeout(resolve, 1200));
      Promise.race([fonts, timeout]).then(() => setTimeout(finish, 120));
    };

    if (document.readyState === "complete") {
      afterLoad();
    } else {
      window.addEventListener("load", afterLoad);
      // Vangnet: nooit langer dan 2,6s wachten op trage assets
      setTimeout(finish, 2600);
    }
  }

  /* ---------- 2. Thema (licht/donker) ---------- */
  function initTheme() {
    const toggle = $("#themeToggle");
    const root = document.documentElement;

    const apply = (mode) => {
      root.dataset.theme = mode === "light" ? "light" : "dark";

      // Adresbalk van mobiele browsers mee laten kleuren
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", root.dataset.theme === "light" ? "#f5f4f1" : "#07070b");
      if (toggle) {
        toggle.setAttribute(
          "title",
          root.dataset.theme === "light" ? "Schakel naar donker" : "Schakel naar licht"
        );
      }
      try {
        localStorage.setItem("theme", root.dataset.theme);
      } catch (e) {}
    };

    // Respecteer systeemvoorkeur als er nog geen keuze is gemaakt
    if (!root.dataset.theme) {
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      apply(prefersLight ? "light" : "dark");
      try {
        if (!localStorage.getItem("theme")) root.dataset.theme = prefersLight ? "light" : "dark";
      } catch (e) {}
    }

    if (toggle) {
      toggle.addEventListener("click", () => {
        apply(root.dataset.theme === "light" ? "dark" : "light");
      });
    }

    // Ook bij het laden meteen de juiste adresbalk-kleur en tooltip zetten
    apply(root.dataset.theme === "light" ? "light" : "dark");
  }

  /* ---------- 3. Custom cursor (stip exact, ring met korte easing) ---------- */
  function initCursor() {
    const dot = $("#cursorDot");
    const ring = $("#cursorRing");
    if (!dot || !ring || !finePointer || reduceMotion) return;

    document.body.classList.add("has-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let visible = false;
    let rafId = null;

    const place = (el, px, py) => {
      el.style.transform = "translate3d(" + px + "px," + py + "px,0)";
    };

    // De ring loopt mee en zet zichzelf stil zodra hij bij is:
    // dan draait er geen enkele animatielus meer als de muis stilstaat.
    const step = () => {
      const dx = x - rx;
      const dy = y - ry;
      if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
        rx = x;
        ry = y;
        place(ring, rx, ry);
        rafId = null;
        return;
      }
      rx += dx * 0.34;
      ry += dy * 0.34;
      place(ring, rx, ry);
      rafId = requestAnimationFrame(step);
    };

    const kick = () => {
      if (rafId === null) rafId = requestAnimationFrame(step);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        x = e.clientX;
        y = e.clientY;
        // Direct in dezelfde frame plaatsen: geen lerp, dus geen merkbare vertraging.
        place(dot, x, y);
        if (!visible) {
          visible = true;
          rx = x;
          ry = y;
          place(ring, rx, ry);
          dot.classList.add("is-visible");
          ring.classList.add("is-visible");
          return;
        }
        kick();
      },
      { passive: true }
    );

    const hide = () => {
      dot.classList.remove("is-visible");
      ring.classList.remove("is-visible");
    };
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointerenter", () => {
      if (visible) {
        dot.classList.add("is-visible");
        ring.classList.add("is-visible");
      }
    });

    window.addEventListener("pointerdown", () => dot.classList.add("is-down"), { passive: true });
    window.addEventListener("pointerup", () => dot.classList.remove("is-down"), { passive: true });

    const hoverTargets = "a, button, summary, input, select, textarea, .tilt, .filter";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest && e.target.closest(hoverTargets)) ring.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest && e.target.closest(hoverTargets)) ring.classList.remove("is-hover");
    });
  }

  /* ---------- 3b. Signatuur: interactieve aurora op canvas ---------- */
  function initAurora() {
    const canvas = $("#aurora");
    if (!canvas || reduceMotion || !canvas.getContext) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      canvas.style.display = "none";
      return;
    }

    const host = canvas.parentElement;
    const palette = [
      { c: [138, 168, 255], r: 0.7, ax: 0.22, ay: 0.16, sp: 0.00011, ph: 0 },
      { c: [185, 140, 255], r: 0.62, ax: 0.18, ay: 0.2, sp: 0.00016, ph: 2.2 },
      { c: [255, 158, 203], r: 0.42, ax: 0.16, ay: 0.14, sp: 0.0002, ph: 4.1 },
      { c: [94, 234, 212], r: 0.38, ax: 0.17, ay: 0.12, sp: 0.00009, ph: 1.3 },
    ];

    const isSmall = () => window.innerWidth < 760;
    const pointer = { x: 0.5, y: 0.42, tx: 0.5, ty: 0.42 };
    let blobs = isSmall() ? palette.slice(0, 3) : palette;
    let w = 1;
    let h = 1;
    let running = false;
    let onScreen = true;
    let lastFrame = 0;

    // Het is een zachte gradient: intern op 42% resolutie tekenen scheelt
    // ~80% vulwerk en is met het blote oog niet te zien.
    const RENDER_SCALE = 0.42;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.max(1, Math.round(w * RENDER_SCALE));
      canvas.height = Math.max(1, Math.round(h * RENDER_SCALE));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      blobs = isSmall() ? palette.slice(0, 3) : palette;
    };

    const frame = (now) => {
      if (!running) return;
      requestAnimationFrame(frame);
      // ~30 fps: ruim vloeiend voor langzaam drijvende wolken, zuinig met de processor
      if (now - lastFrame < 33) return;
      lastFrame = now;

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      const dark = document.documentElement.dataset.theme !== "light";
      const alpha = dark ? 0.32 : 0.17;
      const base = Math.max(w, h);

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      blobs.forEach((b, i) => {
        const cx = (0.55 + b.ax * Math.sin(now * b.sp + b.ph) + (pointer.x - 0.5) * (0.14 + i * 0.03)) * w;
        const cy = (0.3 + b.ay * Math.cos(now * b.sp * 1.3 + b.ph) + (pointer.y - 0.42) * (0.1 + i * 0.02)) * h;
        const radius = base * b.r * (isSmall() ? 0.72 : 1);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const [r, g, bl] = b.c;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, ${alpha})`);
        grad.addColorStop(0.55, `rgba(${r}, ${g}, ${bl}, ${alpha * 0.26})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";
    };

    const start = () => {
      if (running) return;
      running = true;
      lastFrame = 0;
      requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
    };

    resize();
    start();

    let resizeTimer;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 160);
      },
      { passive: true }
    );

    // Alleen tekenen als de hero in beeld is en het tabblad actief is
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            onScreen = entry.isIntersecting;
            if (onScreen && !document.hidden) start();
            else stop();
          });
        },
        { threshold: 0 }
      ).observe(canvas);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden || !onScreen) stop();
      else start();
    });

    if (finePointer) {
      host.addEventListener(
        "pointermove",
        (e) => {
          const rect = host.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          pointer.tx = (e.clientX - rect.left) / rect.width;
          pointer.ty = (e.clientY - rect.top) / rect.height;
        },
        { passive: true }
      );
    }
  }

  /* ---------- 3c. Spotlight dat de cursor volgt ---------- */
  function initSpotlight() {
    const spot = $("#spotlight");
    if (!spot || !finePointer || reduceMotion) return;

    let pending = false;
    let x = 50;
    let y = 30;

    window.addEventListener(
      "pointermove",
      (e) => {
        x = (e.clientX / window.innerWidth) * 100;
        y = (e.clientY / window.innerHeight) * 100;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          spot.style.setProperty("--sx", x.toFixed(2) + "%");
          spot.style.setProperty("--sy", y.toFixed(2) + "%");
          pending = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- 4. Scroll: progress, nav, actieve link ---------- */
  function initScrollUI() {
    const nav = $("#nav");
    const bar = $("#progressBar");
    let ticking = false;

    const update = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + "%";
      if (nav) nav.classList.toggle("is-stuck", scrolled > 24);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  function initActiveLink() {
    const links = $$('.nav__links a[href^="#"], .mobile-menu a[href^="#"]');
    const sections = links
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;

    const hero = $(".hero");

    const setActive = (id) => {
      links.forEach((a) => {
        a.classList.toggle("is-active", id !== null && a.getAttribute("href") === "#" + id);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.some((entry) => entry.target === hero)) return setActive(null);
        visible
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .slice(0, 1)
          .forEach((entry) => setActive(entry.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.2, 0.6] }
    );

    sections.forEach((section) => observer.observe(section));
    if (hero) observer.observe(hero);
  }

  /* ---------- 5. Mobiel menu ---------- */
  function initMenu() {
    const burger = $("#burger");
    const menu = $("#mobileMenu");
    if (!burger || !menu) return;

    const close = () => {
      burger.setAttribute("aria-expanded", "false");
      menu.hidden = true;
      document.body.classList.remove("is-locked");
    };

    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      if (open) return close();
      burger.setAttribute("aria-expanded", "true");
      menu.hidden = false;
      document.body.classList.add("is-locked");
    });

    $$("a", menu).forEach((a) => a.addEventListener("click", close));
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 980) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* ---------- 6. Reveal bij scrollen ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Vertraging uit data-delay zodat elementen na elkaar binnenkomen
    items.forEach((el) => {
      const delay = parseInt(el.dataset.delay || "0", 10);
      el.style.transitionDelay = delay + "ms";
      el.style.setProperty("--d", delay + "ms"); // gebruikt door de hero-animatie
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("is-visible");
          observer.unobserve(el);
          // Opruimen zodat hover-transities niet vertraagd blijven
          setTimeout(() => {
            el.style.transitionDelay = "";
          }, 1400);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ---------- 7. Teller-statistieken ---------- */
  function initCounters() {
    const counters = $$(".count");
    if (!counters.length) return;

    const run = (el) => {
      const target = parseFloat(el.dataset.target || "0");
      const suffix = el.dataset.suffix || "";
      const duration = 1500;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window) || reduceMotion) {
      counters.forEach((el) => (el.textContent = el.dataset.target + (el.dataset.suffix || "")));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => observer.observe(el));
  }

  /* ---------- 8. 3D-tilt op kaarten ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;

    $$(".tilt").forEach((card) => {
      let raf = null;

      const move = (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform =
            `perspective(1000px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-6px)`;
          raf = null;
        });
      };

      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- 9. Magnetische knoppen ---------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;

    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.28;
        el.style.transform = `translate3d(${x}px, ${y - 3}px, 0)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- 10. Parallax in de hero ---------- */
  function initParallax() {
    const glow = $(".hero__glow");
    if (!glow || reduceMotion) return;

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, 900);
          glow.style.transform = `translateX(-50%) translateY(${y * 0.18}px)`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- 11. Projectfilter ---------- */
  function initFilters() {
    const buttons = $$(".filter");
    const projects = $$(".project[data-cat]");
    if (!buttons.length || !projects.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        buttons.forEach((b) => b.classList.toggle("is-active", b === button));

        // In gefilterde stand vervalt de redactionele opstelling: rustige kaarten
        const grid = $(".projects");
        if (grid) grid.classList.toggle("is-filtered", filter !== "all");

        projects.forEach((project) => {
          const cats = (project.dataset.cat || "").split(/\s+/);
          const show = filter === "all" || cats.includes(filter);
          project.classList.toggle("is-hidden", !show);
          if (show) {
            project.classList.add("is-visible");
            project.animate(
              [
                { opacity: 0, transform: "translateY(14px)" },
                { opacity: 1, transform: "none" },
              ],
              { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
            );
          }
        });
      });
    });
  }

  /* ---------- 12. FAQ: één tegelijk open ---------- */
  function initAccordion() {
    const items = $$(".acc");
    if (!items.length) return;

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ---------- 13. Contactformulier ---------- */
  function initForm() {
    const form = $("#contactForm");
    if (!form) return;

    const status = $("#formStatus");
    const email = "eliyahimpelmans9@gmail.com";

    const setError = (field, isError) => {
      const wrapper = field.closest(".field");
      if (wrapper) wrapper.classList.toggle("has-error", isError);
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("#name");
      const mail = $("#email");
      const subject = $("#subject");
      const message = $("#message");

      const invalid = !name.value.trim() || !message.value.trim() || !/^\S+@\S+\.\S+$/.test(mail.value);
      [name, mail, message].forEach((field) => setError(field, !field.value.trim() || (field === mail && !/^\S+@\S+\.\S+$/.test(mail.value))));

      if (invalid) {
        if (status) {
          status.textContent = "Vul je naam, een geldig e-mailadres en een bericht in.";
          status.classList.add("is-error");
        }
        return;
      }

      const body = [
        "Naam: " + name.value.trim(),
        "E-mail: " + mail.value.trim(),
        "Onderwerp: " + (subject ? subject.value : "Website"),
        "",
        message.value.trim(),
      ].join("\n");

      window.location.href =
        "mailto:" + email + "?subject=" + encodeURIComponent("Nieuwe aanvraag — " + name.value.trim()) +
        "&body=" + encodeURIComponent(body);

      if (status) {
        status.textContent = "Je e-mailprogramma opent met het bericht klaar om te versturen. Bedankt!";
        status.classList.remove("is-error");
      }
      form.reset();
    });

    $$("input, textarea", form).forEach((field) => {
      field.addEventListener("input", () => setError(field, false));
    });
  }

  /* ---------- 14. WhatsApp ---------- */
  // Zet hier één keer het nummer neer (landcode zonder +, dus 31612345678).
  // Staat het leeg, dan blijven de WhatsApp-knoppen verborgen in plaats van
  // dat er een dode link op de site staat.
  const WHATSAPP_NUMBER = "31639799965";

  function initWhatsApp() {
    const links = $$("[data-whatsapp]");
    if (!links.length) return;

    const digits = WHATSAPP_NUMBER.replace(/\D/g, "");
    if (!digits) return;

    const url =
      "https://wa.me/" +
      digits +
      "?text=" +
      encodeURIComponent("Hoi Eliyah, ik heb een vraag over een website.");

    links.forEach((link) => {
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.hidden = false;
    });

    const wrap = $(".contact__quick");
    if (wrap) wrap.hidden = false;
  }

  /* ---------- 15. Overige ---------- */
  function initMisc() {
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    // Vloeiend scrollen met correcte offset (oudere browsers zonder scroll-padding)
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (id === "#" || id.length < 2) return;
        const target = document.getElementById(id.slice(1));
        if (!target) return;
        // De skip-link laten we aan de browser: die zet ook de focus meteen goed.
        if (link.classList.contains("skip-link")) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
        history.replaceState(null, "", id);
      });
    });
  }

  /* ---------- Start ---------- */
  function boot() {
    initLoader();
    initTheme();
    initCursor();
    initAurora();
    initSpotlight();
    initScrollUI();
    initActiveLink();
    initMenu();
    initReveal();
    initCounters();
    initTilt();
    initMagnetic();
    initParallax();
    initFilters();
    initAccordion();
    initForm();
    initWhatsApp();
    initMisc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
