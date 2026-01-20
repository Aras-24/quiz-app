const Result = require("../models/result");
const User = require("../models/user");

function sendError(res, message, status = 400) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
}

async function rankingHandler(req, res) {
    try {
        if (req.method === "GET") {
            // Aggregation: Gruppiere nach User, nimm den besten Score + schnellste Zeit
            const topResults = await Result.aggregate([
                { $match: { isExam: true } }, 
                { $sort: { score: -1, timeUsed: 1 } }, 
                { $group: { 
                    _id: "$user", 
                    bestScore: { $first: "$score" }, 
                    bestTime: { $first: "$timeUsed" },
                    date: { $first: "$date" }
                }},
                { $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userData"
                }},
                { $unwind: "$userData" },
                { $sort: { bestScore: -1, bestTime: 1 } },
                { $limit: 10 }
            ]);

            const ranking = topResults.map(r => ({
                username: r.userData.username,
                score: r.bestScore,
                timeUsed: r.bestTime,
                date: r.date
            }));

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ranking }));
        }

        return sendError(res, "Ranking-Methode nicht erlaubt", 405);
    } catch (err) {
        console.error("Ranking-Fehler:", err);
        return sendError(res, "Interner Serverfehler", 500);
    }
}

module.exports = rankingHandler;