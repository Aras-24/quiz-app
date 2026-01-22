// adminQuestions.js

const Question = require("../models/question");
const bodyParser = require("../utils/bodyParser");
const adminAuth = require("../utils/adminAuth");

function sendError(res, msg, code = 403) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: msg }));
}

async function adminQuestions(req, res) {
  const admin = adminAuth(req);
  if (!admin) return sendError(res, "Adminrechte erforderlich");

  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  // CREATE
  if (req.method === "POST" && pathname === "/api/admin/questions") {
    const data = await bodyParser(req);

    if (data.type === "MC") {
      const correctCount = data.answers.filter(a => a.correct).length;
      if (correctCount > 1) {
        data.hint = "Mehrere Antworten können korrekt sein";
      }
    }

    const q = await Question.create(data);
    return res.end(JSON.stringify(q));
  }

  // READ
  if (req.method === "GET" && pathname === "/api/admin/questions") {
    const list = await Question.find();
    return res.end(JSON.stringify({ questions: list }));
  }

  // DELETE
  if (req.method === "DELETE") {
    const id = pathname.split("/").pop();
    await Question.findByIdAndDelete(id);
    return res.end(JSON.stringify({ message: "Frage gelöscht" }));
  }

  sendError(res, "Admin-Endpunkt nicht gefunden", 404);
}

module.exports = adminQuestions;
