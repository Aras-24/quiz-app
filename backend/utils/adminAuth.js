// adminAuth.js

const jwtUtil = require("./jwt");

function adminAuth(req) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.split(" ")[1];
  const user = jwtUtil.verify(token);
  if (!user) return null;

  if (user.role !== "ROLE_ADMIN") return null;

  return user;
}

module.exports = adminAuth;
