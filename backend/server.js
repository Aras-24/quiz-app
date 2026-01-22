//server.js

const http = require("http");
const { PORT } = require("./config");
const authHandler = require("./routes/auth");
const quizHandler = require("./routes/quiz");
const rankingHandler = require("./routes/ranking");
const categoriesHandler = require("./routes/categories");
const adminQuestions = require("./routes/adminQuestions");
const initAdmin = require("./utils/initAdmin");

require("./db");
initAdmin();

// Erlaube GitHub Pages & lokale Tests
const ALLOWED_ORIGINS = [
  "https://aras-24.github.io", // Frontend GitHub Pages
  "http://localhost:5500", // lokal
  "http://127.0.0.1:5500", // lokal
];

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress
    .replace("::ffff:", "")
    .replace("::1", "127.0.0.1");
}

const server = http.createServer(async (req, res) => {
  try {
    const ip = getClientIp(req);
    const baseUrl = `http://${req.headers.host}`;
    const parsedUrl = new URL(req.url, baseUrl);
    const pathname = parsedUrl.pathname.replace(/\/$/, "");

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${pathname} - ${ip}`,
    );

    // --- CORS ---
    //console.log("Origin test mit *:", req.headers.origin);
    //console.log("ALLOWED_ORIGINS:", ALLOWED_ORIGINS);

    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    // --- Routing ---
    if (pathname === "/api/register" || pathname === "/api/login")
      return authHandler(req, res);
    if (pathname.startsWith("/api/quiz")) return quizHandler(req, res);
    if (pathname.startsWith("/api/categories"))
      return categoriesHandler.getCategories(req, res);
    if (pathname.startsWith("/api/ranking")) return rankingHandler(req, res);
    if (pathname.startsWith("/api/admin/questions"))
      return adminQuestions(req, res);

    // Global 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route nicht gefunden" }));
  } catch (err) {
    console.error("🔥 Serverfehler:", err.stack);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Interner Serverfehler" }));
    }
  }
});

server.listen(PORT, () => {
  const isRender = Boolean(process.env.RENDER);
  if (isRender) {
    console.log(`✅ Server läuft auf Render`);
    console.log(`Public URL: https://quiz-app-9xz2.onrender.com`);
  } else {
    console.log(`✅ Server läuft lokal auf http://localhost:${PORT}`);
  }
});
