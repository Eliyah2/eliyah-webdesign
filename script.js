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
    const done = () => document.body.classList.add("is-ready");
    if (document.readyState === "complete") {
      setTimeout(done, 250);
    } else {
      window.addEventListener("load", () => setTimeout(done, 250));
      // Vangnet: nooit langer dan 1,6s wachten op trage assets
      setTimeout(done, 1600);
    }
  }

  /* ---------- 2. Thema (licht/donker) ---------- */
  function initTheme() {
    const toggle = $("#themeToggle");
    const root = document.documentElement;

    const apply = (mode) => {
      root.dataset.theme = mode === "light" ? "light" : "dark";
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
  }

  /* ---------- 3. Custom cursor ---------- */
  function initCursor() {
    const cursor = $("#cursor");
    if (!cursor || !finePointer || reduceMotion) return;

    document.body.classList.add("has-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    let visible = false;

    window.addEventListener(
      "pointermove",
      (e) => {
        x = e.clientX;
        y = e.clientY;
        if (!visible) {
          visible = true;
          cursor.classList.remove("cursor--hidden");
        }
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", () => cursor.classList.add("cursor--hidden"));
    document.addEventListener("pointerenter", () => cursor.classList.remove("cursor--hidden"));

    const hoverTargets = "a, button, summary, input, select, textarea, .tilt, .filter";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest && e.target.closest(hoverTargets)) cursor.classList.add("cursor--hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest && e.target.closest(hoverTargets)) cursor.classList.remove("cursor--hover");
    });

    // Vloeiende nabeweging (lerp)
    (function follow() {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(follow);
    })();
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

    const setActive = (id) => {
      links.forEach((a) => {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .slice(0, 1)
          .forEach((entry) => setActive(entry.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.2, 0.6] }
    );

    sections.forEach((section) => observer.observe(section));
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

  /* ---------- 14. Overige ---------- */
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
    initMisc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
