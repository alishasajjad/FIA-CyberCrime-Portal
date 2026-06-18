const bcrypt = require("bcrypt");
const User = require("../models/User");

async function seedDefaultAdmin() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("[SeedAdmin] DEFAULT_ADMIN_EMAIL/DEFAULT_ADMIN_PASSWORD not set; skipping seeding.");
    return;
  }

  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name: "Default Admin",
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role: "Admin",
    unit: "Cyber Operations",
    phoneNumber: "",
    cnic: "",
    status: "Active",
  });

  console.log("[SeedAdmin] Default admin seeded:", email);
}

module.exports = { seedDefaultAdmin };

