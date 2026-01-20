const User = require("../models/user");

async function initAdmin() {
  const adminExists = await User.exists({ role: "ROLE_ADMIN" });
  if (adminExists) return;

  await User.create({
    username: "admin",
    password: "admin1234",
    role: "ROLE_ADMIN"
  });

  console.log("✅ Initial-Admin erstellt: admin / admin1234");
}

module.exports = initAdmin;
