// user.js

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["ROLE_USER", "ROLE_ADMIN"],
      default: "ROLE_USER",
    },
  },
  { timestamps: true }
);

// ================================
// Passwort hashen (OWASP A02)
// ================================
// Korrekte async/await Version ohne next()
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // nur hashen, wenn geändert
  this.password = await bcrypt.hash(this.password, 12);
});

// ================================
// Passwort vergleichen
// ================================
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
