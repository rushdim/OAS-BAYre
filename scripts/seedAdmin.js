require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = (process.env.ADMIN_EMAIL || "rodhdimustafayousif@gmail.co").toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin account already exists: ${email}`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || "Rushdi ",
      email,
      password: process.env.ADMIN_PASSWORD || "Rushdi1234",
      role: "admin",
    });
    console.log(`Admin account created: ${email} / ${process.env.ADMIN_PASSWORD || "Rushdi1234"}`);
    console.log("Please log in and change this password if you add that feature, or update it directly in MongoDB.");
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
