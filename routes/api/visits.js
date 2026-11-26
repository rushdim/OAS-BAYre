const express = require("express");
const router = express.Router();
const { requireLogin } = require("../../middleware/auth");
const ServiceVisit = require("../../models/ServiceVisit");
const Car = require("../../models/Car");
const Part = require("../../models/Part");

router.get("/", requireLogin, async (req, res) => {
  const q = req.query.q || "";
  let carFilter = {};
  if (q) {
    const cars = await Car.find({ plateNumber: new RegExp(q, "i") }).select("_id");
    carFilter = { car: { $in: cars.map((c) => c._id) } };
  }
  const visits = await ServiceVisit.find(carFilter)
    .populate({ path: "car", populate: { path: "customer" } })
    .populate("technicians")
    .sort({ createdAt: -1 });
  res.json({ visits });
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const { car, services, technicians, otherRepairNote, otherRepairCharge, parts } = req.body;
    // parts: [{ partId, qty }]

    if (!car || !Array.isArray(services) || services.length === 0 || !Array.isArray(technicians) || technicians.length === 0) {
      return res.status(400).json({ error: "Car, at least one service, and at least one technician are required." });
    }

    const partsUsed = [];
    for (const item of parts || []) {
      const qty = Number(item.qty) || 0;
      if (!item.partId || qty <= 0) continue;
      const partDoc = await Part.findById(item.partId);
      if (!partDoc) continue;
      if (partDoc.stockQty < qty) {
        return res.status(400).json({ error: `Not enough stock for "${partDoc.name}". Available: ${partDoc.stockQty}.` });
      }
      partsUsed.push({
        part: partDoc._id,
        name: partDoc.name,
        unitPrice: partDoc.unitPrice,
        quantity: qty,
        lineTotal: partDoc.unitPrice * qty,
      });
    }

    const visit = new ServiceVisit({
      car,
      technicians,
      services,
      otherRepairNote: services.includes("other_repair") ? otherRepairNote : "",
      otherRepairCharge: services.includes("other_repair") ? Number(otherRepairCharge) || 0 : 0,
      partsUsed,
      createdBy: req.session.user.id,
    });
    visit.computeTotals();
    await visit.save();

    for (const p of partsUsed) {
      await Part.findByIdAndUpdate(p.part, { $inc: { stockQty: -p.quantity } });
    }

    res.json({ visit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong while saving the visit." });
  }
});

router.get("/:id", requireLogin, async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id)
      .populate({ path: "car", populate: { path: "customer" } })
      .populate("technicians");
    if (!visit) return res.status(404).json({ error: "Visit not found." });
    res.json({ visit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load visit." });
  }
});

module.exports = router;
