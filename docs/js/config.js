// config.js

// Wenn du lokal testest, wird localhost verwendet
// Wenn auf GitHub Pages oder live, Render Backend
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_BASE = isLocal
  ? "http://localhost:3000"
  : "https://quiz-app-9xz2.onrender.com";
