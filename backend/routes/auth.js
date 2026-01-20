// auth.js

const User = require("../models/user");
const bodyParser = require("../utils/bodyParser");
const jwtUtil = require("../utils/jwt");
const rateLimit = require("../utils/rateLimit");

function sendError(res, message, status = 400) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

async function authHandler(req, res) {
  const ip = req.socket.remoteAddress.replace("::ffff:", "").replace("::1", "127.0.0.1");
  
  // 1. Rate Limiting prüfen
  if (!rateLimit(ip)) return sendError(res, "Zu viele Anfragen", 429);

  // 2. URL für internen Check vorbereiten
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname.replace(/\/$/, "");

  // 3. Body parsen (nur bei POST sinnvoll)
  let data;
  if (req.method === "POST") {
    try { 
      data = await bodyParser(req); 
    } catch (err) { 
      return sendError(res, "Ungültiges JSON Format"); 
    }
  }

  // --- Registrierung ---
  if (req.method === "POST" && pathname === "/api/register") {
    if (!data.username || !data.password) {
      return sendError(res, "Benutzername und Passwort erforderlich");
    }

    try {
      await User.create({ username: data.username, password: data.password });
      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Registrierung erfolgreich" }));
    } catch (err) {
      if (err.code === 11000) return sendError(res, "Benutzername existiert bereits");
      console.error("Registrierungsfehler:", err);
      return sendError(res, "Registrierung fehlgeschlagen", 500);
    }
  }

  // --- Login ---
  if (req.method === "POST" && pathname === "/api/login") {
    const failMsg = "Benutzername oder Passwort falsch";
    
    if (!data.username || !data.password) {
        return sendError(res, "Bitte alle Felder ausfüllen");
    }

    try {
      const user = await User.findOne({ username: data.username });
      if (!user) return sendError(res, failMsg, 401);

      const valid = await user.comparePassword(data.password);
      if (!valid) return sendError(res, failMsg, 401);

      const token = jwtUtil.sign({ userId: user._id, username: user.username, role: user.role});
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ token, username: user.username, role: user.role }));
    } catch (err) {
      console.error("Loginfehler:", err);
      return sendError(res, "Login fehlgeschlagen", 500);
    }
  }

  // Fallback innerhalb des Handlers
  return sendError(res, "Methode oder Pfad im Auth-Handler nicht unterstützt", 404);
}

module.exports = authHandler;