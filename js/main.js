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
   MOBILE NAV TOGGLE
=========================== */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-label", isOpen ? "Menu sluiten" : "Menu openen");
  });

  // Sluit menu bij klik op link
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-label", "Menu openen");
    });
  });
}
