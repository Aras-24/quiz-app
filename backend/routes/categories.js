// categories.js

const Question = require("../models/question");
const jwtUtil = require("../utils/jwt");

/**
 * Holt alle einzigartigen Kategorien aus der Datenbank,
 * die mindestens einer Frage zugeordnet sind.
 */
exports.getCategories = async (req, res) => {
    try {
        // 1. Authentifizierung prüfen
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];
        const decoded = jwtUtil.verify(token);

        if (!token || !decoded) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Nicht autorisiert. Bitte erneut anmelden." }));
        }

        // 2. Einzigartige Kategorien aus der MongoDB abrufen
        // Question.distinct("category") gibt ein Array aller vorkommenden Kategorien zurück
        const categories = await Question.distinct("category");

        // 3. Antwort senden
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
            success: true,
            categories: categories || [] 
        }));
        
    } catch (err) {
        console.error("Fehler in getCategories:", err.message);
        
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
            error: "Interner Serverfehler beim Laden der Kategorien",
            details: err.message 
        }));
    }
};