const express = require("express");
const router = express.Router();
const { requireLogin } = require("../../middleware/auth");
const Car = require("../../models/Car");
const ServiceVisit = require("../../models/ServiceVisit");

router.get("/", requireLogin, async (req, res) => {
  const q = req.query.q || "";
  const filter = q ? { plateNumber: new RegExp(q, "i") } : {};
  const cars = await Car.find(filter).populate("customer").sort({ createdAt: -1 });
  res.json({ cars });
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const { plateNumber, make, model, category, customer } = req.body;
    if (!plateNumber || !make || !category || !customer) {
      return res.status(400).json({ error: "Plate number, make, category and customer are required." });
    }
    const existing = await Car.findOne({ plateNumber: plateNumber.trim().toUpperCase() });
    if (existing) return res.status(400).json({ error: "A car with that plate number already exists." });
    const car = await Car.create({ plateNumber, make, model, category, customer });
    res.json({ car });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.get("/:id", requireLogin, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate("customer");
    if (!car) return res.status(404).json({ error: "Car not found." });
    const visits = await ServiceVisit.find({ car: car._id }).populate("technicians").sort({ createdAt: -1 });
    res.json({ car, visits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load car." });
  }
});

module.exports = router;
