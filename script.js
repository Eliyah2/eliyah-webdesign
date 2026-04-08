/* ===========================
   FOOTER JAAR
=========================== */
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/* ===========================
   PAGE FADE-IN
=========================== */
window.addEventListener("load", () => {
  document.body.classList.remove("no-anim");
  document.body.classList.add("loaded");
});

/* ===========================
   SMOOTH SCROLL NAAR CONTACT
=========================== */
const contactBtn = document.getElementById("contactBtn");
if (contactBtn) {
  contactBtn.addEventListener("click", () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  });
}

/* ===========================
   DARK MODE TOGGLE
=========================== */
const body = document.body;
const toggle = document.getElementById("themeToggle");

// laad voorkeur
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  if (toggle) toggle.textContent = "☀️";
}

// toggle dark mode
toggle?.addEventListener("click", () => {
  const isDark = body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  toggle.textContent = isDark ? "☀️" : "🌙";
});

/* ===========================
   SCROLL REVEAL ANIMATIONS
=========================== */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

// alle elementen die moeten animeren
document.querySelectorAll(".will-animate").forEach((el) => {
  observer.observe(el);
});
