const express = require("express");
const router = express.Router();
const { requireLogin } = require("../../middleware/auth");
const ServiceVisit = require("../../models/ServiceVisit");
const Part = require("../../models/Part");
const Car = require("../../models/Car");
const Customer = require("../../models/Customer");

router.get("/", requireLogin, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todaysVisits, lowStockParts, totalCars, totalCustomers] = await Promise.all([
      ServiceVisit.find({ createdAt: { $gte: startOfDay } }).populate("car"),
      Part.find({ $expr: { $lte: ["$stockQty", "$reorderLevel"] } }),
      Car.countDocuments(),
      Customer.countDocuments(),
    ]);

    const todaysRevenue = todaysVisits.reduce((sum, v) => sum + (v.grandTotal || 0), 0);

    res.json({ todaysVisits, todaysRevenue, lowStockParts, totalCars, totalCustomers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load dashboard." });
  }
});

module.exports = router;
