// config.js

require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "devsecret",
  TOKEN_EXPIRES: process.env.TOKEN_EXPIRES || "1h",
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quizapp"
};
