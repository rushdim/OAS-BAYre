const express = require("express");
const router = express.Router();
const { requireLogin } = require("../../middleware/auth");
const Customer = require("../../models/Customer");
const Car = require("../../models/Car");
const ServiceVisit = require("../../models/ServiceVisit");

router.get("/", requireLogin, async (req, res) => {
  const q = req.query.q || "";
  const filter = q ? { $or: [{ name: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }] } : {};
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json({ customers });
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Name and phone are required." });
    const customer = await Customer.create({ name, phone, email });
    res.json({ customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.get("/:id", requireLogin, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found." });
    const cars = await Car.find({ customer: customer._id });
    const visits = await ServiceVisit.find({ car: { $in: cars.map((c) => c._id) } })
      .populate("car")
      .sort({ createdAt: -1 });
    res.json({ customer, cars, visits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load customer." });
  }
});

module.exports = router;
