require("dotenv").config();
const mongoose = require("mongoose");
const Part = require("../models/Part");

// Sample starter catalog using the price ranges given in the business brief (UGX)
const parts = [
  { name: "Engine Oil (Standard)", category: "engine_oil", unitPrice: 79000, stockQty: 20, reorderLevel: 5 },
  { name: "Engine Oil (Premium/Synthetic)", category: "engine_oil", unitPrice: 200000, stockQty: 10, reorderLevel: 5 },
  { name: "Gearbox Oil", category: "gearbox_oil", unitPrice: 95000, stockQty: 15, reorderLevel: 5 },
  { name: "Oil Filter", category: "oil_filter", unitPrice: 18000, stockQty: 25, reorderLevel: 8 },
  { name: "Brake Fluid", category: "brake_fluid", unitPrice: 15000, stockQty: 20, reorderLevel: 5 },
  { name: "Brake Pads (Set)", category: "brake_pad", unitPrice: 120000, stockQty: 12, reorderLevel: 4 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const p of parts) {
    const existing = await Part.findOne({ name: p.name });
    if (!existing) {
      await Part.create(p);
      console.log(`Created part: ${p.name}`);
    } else {
      console.log(`Part already exists: ${p.name}`);
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
