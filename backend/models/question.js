// question.js

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["MC", "OPEN"],
    required: true
  },

  question: {
    type: String,
    required: true
  },

  // 🔹 Multiple Choice
  answers: [{
    text: { type: String, required: true },
    correct: { type: Boolean, default: false } // mehrere richtige Antworten möglich
  }],

  // 🔹 Offene Frage
  solution: String,      // die richtige Antwort als Text
  keywords: [String]     // Schlagwörter für automatische Bewertung / Suche

}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
