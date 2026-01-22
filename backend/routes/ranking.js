//ranking.js

const Result = require("../models/result");
const User = require("../models/user");

async function rankingHandler(req, res) {
    try {
        const topResults = await Result.aggregate([
            { $match: { isExam: true } },
            { $sort: { score: -1, timeUsed: 1 } },
            { $group: {
                _id: "$user",
                bestScore: { $first: "$score" },
                bestTime: { $first: "$timeUsed" }
            }},
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userData" } },
            { $unwind: "$userData" },
            { $sort: { bestScore: -1, bestTime: 1 } },
            { $limit: 10 }
        ]);

        const ranking = topResults.map(r => ({
            username: r.userData.username,
            score: r.bestScore,
            timeUsed: r.bestTime
        }));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ranking }));
    } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Server Error" }));
    }
}

module.exports = rankingHandler;