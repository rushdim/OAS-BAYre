const mongoose = require("mongoose");

const partSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["engine_oil", "gearbox_oil", "oil_filter", "brake_fluid", "brake_pad", "other"],
      required: true,
    },
    unitPrice: { type: Number, required: true, min: 0 }, // UGX
    stockQty: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Part", partSchema);
