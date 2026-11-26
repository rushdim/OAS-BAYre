const express = require("express");
const router = express.Router();
const User = require("../../models/User");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "An account with that email already exists." });
    }
    const user = await User.create({ name, email, password, role: "staff" });
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.json({ user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid email or password." });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ error: "Invalid email or password." });
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.json({ user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get("/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
