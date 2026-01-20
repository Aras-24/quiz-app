const http = require("http");
const { PORT } = require("./config");
const authHandler = require("./routes/auth");
const quizHandler = require("./routes/quiz");
const rankingHandler = require("./routes/ranking");
const initAdmin = require("./utils/initAdmin");
const adminQuestions = require("./routes/adminQuestions");
const categoriesHandler = require("./routes/categories");

require("./db");
initAdmin();

// Erlaube Localhost für Entwicklung und GitHub für Produktion
const ALLOWED_ORIGINS = [
  "http://localhost:5500", 
  "http://127.0.0.1:5500", 
  "https://aras-24.github.io"
];

// NoSQL-Injection Schutz: Entfernt alle Keys die mit $ beginnen
function sanitize(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(v => sanitize(v));
  } else if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    });
  }
  return obj;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress.replace("::ffff:", "").replace("::1", "127.0.0.1");
}

const server = http.createServer(async (req, res) => {
  try {
    const ip = getClientIp(req);
    const baseUrl = `http://${req.headers.host}`;
    const parsedUrl = new URL(req.url, baseUrl);
    const pathname = parsedUrl.pathname.replace(/\/$/, "");

    // --- CORS HANDLING ---
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      // Fallback für Browser ohne Origin Header oder andere erlaubte Quellen
      res.setHeader("Access-Control-Allow-Origin", "https://aras-24.github.io");
    }
    
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    // Body auslesen und sanitizen
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      if (body) {
        try {
          req.body = sanitize(JSON.parse(body));
        } catch (e) { req.body = {}; }
      }

      // --- ROUTING ---
      if (pathname === "/api/register" || pathname === "/api/login") {
        return authHandler(req, res);
      }
      if (pathname.startsWith("/api/quiz")) {
        return quizHandler(req, res);
      }
      if (pathname.startsWith("/api/categories")) {
        return categoriesHandler.getCategories(req, res);
      }
      if (pathname.startsWith("/api/ranking")) {
        return rankingHandler(req, res);
      }
      if (pathname.startsWith("/api/admin/questions")) {
        return adminQuestions(req, res);
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Route nicht gefunden" }));
    });

  } catch (err) {
    console.error("🔥 Serverfehler:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Interner Serverfehler" }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`✅ Sicherer Server läuft auf Port ${PORT}`);
});