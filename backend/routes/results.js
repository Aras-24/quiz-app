// results.js

const fs = require("fs");
const path = require("path");

exports.saveResult = (req, res, body) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" }));

    const data = JSON.parse(body.toString());
    const { score, total } = data;

    const username = req.user?.username || "Unknown";

    const resultsPath = path.join(__dirname, "../data/results.json");
    let results = [];
    if (fs.existsSync(resultsPath)) {
        results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    }

    results.push({ username, score, total, date: new Date() });
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
};
