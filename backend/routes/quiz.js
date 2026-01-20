const Question = require("../models/question");
const Result = require("../models/result");
const jwtUtil = require("../utils/jwt");
const bodyParser = require("../utils/bodyParser");

function sendError(res, message, status = 400) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
}

async function quizHandler(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    const userData = jwtUtil.verify(token);
    
    if (!userData) return sendError(res, "Token ungültig oder fehlt", 401);

    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const pathname = urlObj.pathname.replace(/\/$/, "");

    try {
        // --- Fragen abrufen ---
        if (req.method === "GET" && pathname === "/api/quiz") {
            const category = urlObj.searchParams.get("category");
            const query = (category && category !== "all") ? { category } : {};
            
            const questions = await Question.aggregate([
                { $match: query }, 
                { $sample: { size: 10 } }
            ]);
            
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ questions }));
        }

        // --- Ergebnis speichern mit Platz-1-Check ---
        if (req.method === "POST" && pathname === "/api/quiz/result") {
            const data = await bodyParser(req);

            // 1. Alten Bestwert des Users holen (für Highscore-Check)
            const oldBest = await Result.findOne({ user: userData.userId, isExam: true })
                .sort({ score: -1, timeUsed: 1 });

            // 2. Neues Ergebnis speichern
            await Result.create({
                user: userData.userId,
                score: data.score,
                timeUsed: data.timeUsed || 0,
                isExam: !!data.isExam
            });

            // 3. Globalen Thron-Check machen (Wer ist Platz 1?)
            const globalBest = await Result.findOne({ isExam: true })
                .sort({ score: -1, timeUsed: 1 });

            const isNumberOne = globalBest && globalBest.user.toString() === userData.userId.toString();

            // 4. Persönlichen Highscore-Check machen
            let newHighscore = false;
            if (data.isExam) {
                if (!oldBest || data.score > oldBest.score || (data.score === oldBest.score && data.timeUsed < oldBest.timeUsed)) {
                    newHighscore = true;
                }
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ 
                message: "Ergebnis gespeichert", 
                newHighscore, 
                isNumberOne, 
                score: data.score 
            }));
        }

        return sendError(res, "Endpunkt nicht gefunden", 404);
    } catch (err) {
        console.error(err);
        return sendError(res, "Interner Fehler", 500);
    }
}

module.exports = quizHandler;