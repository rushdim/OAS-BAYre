const express = require("express");
const router = express.Router();
const { requireLogin, requireAdmin } = require("../../middleware/auth");
const Part = require("../../models/Part");

router.get("/", requireLogin, async (req, res) => {
  const parts = await Part.find().sort({ category: 1, name: 1 });
  res.json({ parts });
});

router.post("/", requireLogin, requireAdmin, async (req, res) => {
  try {
    const { name, category, unitPrice, stockQty, reorderLevel } = req.body;
    if (!name || !category || !unitPrice) {
      return res.status(400).json({ error: "Name, category and unit price are required." });
    }
    const part = await Part.create({
      name,
      category,
      unitPrice: Number(unitPrice),
      stockQty: Number(stockQty) || 0,
      reorderLevel: Number(reorderLevel) || 5,
    });
    res.json({ part });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.post("/:id/restock", requireLogin, requireAdmin, async (req, res) => {
  try {
    const qty = Number(req.body.qty) || 0;
    const part = await Part.findByIdAndUpdate(req.params.id, { $inc: { stockQty: qty } }, { new: true });
    res.json({ part });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
