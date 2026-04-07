// Scroll naar contact
document.getElementById("contactBtn").addEventListener("click", () => {
  document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
});

// Jaar in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Dark/light mode
const themeToggle = document.getElementById("themeToggle");

function setTheme(mode) {
  document.body.classList.toggle("light", mode === "light");
  themeToggle.textContent = mode === "light" ? "☀️" : "🌙";
  localStorage.setItem("theme", mode);
}

setTheme(localStorage.getItem("theme") || "dark");

themeToggle.addEventListener("click", () => {
  const newMode = document.body.classList.contains("light") ? "dark" : "light";
  setTheme(newMode);
});
