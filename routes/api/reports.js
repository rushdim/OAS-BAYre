const express = require("express");
const router = express.Router();
const { requireLogin, requireAdmin } = require("../../middleware/auth");
const ServiceVisit = require("../../models/ServiceVisit");

router.get("/", requireLogin, requireAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const visits = await ServiceVisit.find(filter).populate("technicians").populate("car");

    const totalRevenue = visits.reduce((s, v) => s + v.grandTotal, 0);
    const totalVisits = visits.length;

    const partTally = {};
    visits.forEach((v) => v.partsUsed.forEach((p) => { partTally[p.name] = (partTally[p.name] || 0) + p.quantity; }));
    const topParts = Object.entries(partTally).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const techTally = {};
    visits.forEach((v) => v.technicians.forEach((t) => { techTally[t.name] = (techTally[t.name] || 0) + 1; }));
    const techWorkload = Object.entries(techTally).sort((a, b) => b[1] - a[1]);

    res.json({ totalRevenue, totalVisits, topParts, techWorkload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load reports." });
  }
});

module.exports = router;
