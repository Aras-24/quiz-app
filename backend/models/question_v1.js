// question.js

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  question: { type: String, required: true, trim: true },
  answers: {
    type: [String],
    required: true,
    validate: [{ validator: arr => arr.length >= 2 && arr.every(ans => ans.trim().length > 0), message: "Mindestens 2 nicht-leere Antworten erforderlich" }]
  },
  correctIndex: {
    type: Number,
    required: true,
    validate: { validator: v => v >= 0 && v < this.answers.length, message: props => `correctIndex (${props.value}) außerhalb des Antwortbereichs` }
  }
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
