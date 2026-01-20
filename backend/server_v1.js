// server.js

// Node Core Module
const http = require("http");
const { PORT } = require("./config");

// Eigene Module
const authHandler = require("./routes/auth");
const quizHandler = require("./routes/quiz");
const rankingHandler = require("./routes/ranking");
const initAdmin = require("./utils/initAdmin");
const adminQuestions = require("./routes/adminQuestions");
const categoriesHandler = require("./routes/categories");
const resultsHandler = require("./routes/results");

// DB Verbindung
require("./db");
// Admin erstellen
initAdmin();

// CORS & Security
const ALLOWED_ORIGINS = ["http://localhost:5500"];

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress
    .replace("::ffff:", "")
    .replace("::1", "127.0.0.1");
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  try {
    const ip = getClientIp(req);

    // URL sauber parsen
    const baseUrl = `http://${req.headers.host}`;
    const parsedUrl = new URL(req.url, baseUrl);
    const pathname = parsedUrl.pathname.replace(/\/$/, "");

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${pathname} - ${ip}`
    );

    // --- Security Headers ---
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'self'");

    // --- CORS ---
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    // Preflight Requests
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health Check
    if (req.method === "GET" && pathname === "/api/v1/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() })
      );
    }

    // Auth Routen
    if (pathname === "/api/register" || pathname === "/api/login") {
      return authHandler(req, res);
    }

    // Quiz Routen
    if (pathname.startsWith("/api/quiz")) {
      return quizHandler(req, res);
    }

    // Kategorien Routen
    if (pathname.startsWith("/api/categories")) {
      return categoriesHandler(req, res);
    }

    // Ranking Routen
    if (pathname.startsWith("/api/ranking")) {
      return rankingHandler(req, res);
    }

    // Questions Routen
    if (pathname.startsWith("/api/admin/questions")) {
      return adminQuestions(req, res);
    }

    // results Routen
    if (url.startsWith("/api/results")) {
      let body = [];
      req.on("data", (chunk) => body.push(chunk));
      req.on("end", () => {
        resultsHandler.saveResult(req, res, Buffer.concat(body));
      });
    }

    // Fallback für nicht gefundene API-Endpunkte
    if (pathname.startsWith("/api")) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "API Endpunkt nicht gefunden" }));
    }

    // Globaler 404
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  } catch (err) {
    console.error("🔥 Serverfehler:", err.stack);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Interner Serverfehler" }));
    }
  }
});

// Timeout Settings
server.headersTimeout = 6000;
server.requestTimeout = 5000;

// Server starten
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
