// YEAR
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// PAGE LOAD FADE-IN
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

// SMOOTH SCROLL CONTACT BUTTON
const contactBtn = document.getElementById("contactBtn");
if (contactBtn) {
  contactBtn.addEventListener("click", () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// DARK MODE + MEMORY
const body = document.body;
const toggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  if (toggle) toggle.textContent = "☀️";
}

if (toggle) {
  toggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    const mode = body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", mode);
    toggle.textContent = mode === "dark" ? "☀️" : "🌙";
  });
}

// SCROLL ANIMATIONS
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".section, .card, .project-card").forEach(el => {
  observer.observe(el);
});

// BOTTOM NAV (MOBILE)
const bottomNavButtons = document.querySelectorAll(".bottom-nav button");

bottomNavButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    const el = document.querySelector(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// SIMPLE PAGE TRANSITION ON LINK CLICK
const links = document.querySelectorAll("a[href]");

links.forEach(link => {
  const url = new URL(link.href, window.location.href);
  const isSameOrigin = url.origin === window.location.origin;

  if (isSameOrigin) {
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || url.hash && url.pathname === window.location.pathname) return;

      e.preventDefault();
      document.body.classList.remove("loaded");
      setTimeout(() => {
        window.location.href = link.href;
      }, 250);
    });
  }
});
