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

// observeer alle animatie-elementen
document.querySelectorAll(".will-animate").forEach((el) => {
  observer.observe(el);
});
