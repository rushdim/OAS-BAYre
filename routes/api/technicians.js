const express = require("express");
const router = express.Router();
const { requireLogin, requireAdmin } = require("../../middleware/auth");
const Technician = require("../../models/Technician");

router.get("/", requireLogin, async (req, res) => {
  const technicians = await Technician.find().sort({ name: 1 });
  res.json({ technicians });
});

router.post("/", requireLogin, requireAdmin, async (req, res) => {
  try {
    const { name, phone, isSenior } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });
    const technician = await Technician.create({ name, phone, isSenior: !!isSenior });
    res.json({ technician });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.post("/:id/toggle-active", requireLogin, requireAdmin, async (req, res) => {
  const tech = await Technician.findById(req.params.id);
  if (!tech) return res.status(404).json({ error: "Technician not found." });
  tech.active = !tech.active;
  await tech.save();
  res.json({ technician: tech });
});

module.exports = router;
