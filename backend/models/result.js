// result.js

const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number, required: true, min: 0 },
  timeUsed: { type: Number, default: 0 }, // Zeit in Sekunden
  isExam: { type: Boolean, default: false }, // Nur Prüfungen zählen fürs Ranking
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", resultSchema);
