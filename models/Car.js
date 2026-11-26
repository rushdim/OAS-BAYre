const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    category: { type: String, enum: ["heavy", "small", "commercial"], required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
