// jwt.js

const jwt = require("jsonwebtoken");
const config = require("../config");

exports.sign = payload => jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.TOKEN_EXPIRES });
exports.verify = token => {
  try { return jwt.verify(token, config.JWT_SECRET); } 
  catch { return null; }
};
