const mongoose = require("mongoose");

// Fixed business charges (UGX)
const LABOUR_CHARGE = 20000;
const WHEEL_ALIGNMENT_CHARGE = 30000;
const WHEEL_BALANCE_CHARGE = 20000;

const SERVICE_TYPES = [
  "engine_oil_change",
  "gearbox_oil_change",
  "brake_fluid_change",
  "brake_pad_change",
  "greasing",
  "wheel_alignment",
  "wheel_balance",
  "other_repair",
];

const partUsedSchema = new mongoose.Schema(
  {
    part: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
    name: { type: String, required: true }, // snapshot at time of sale
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const serviceVisitSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    technicians: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technician", required: true }],
    services: [{ type: String, enum: SERVICE_TYPES, required: true }],
    otherRepairNote: { type: String, trim: true },
    otherRepairCharge: { type: Number, default: 0 },
    partsUsed: [partUsedSchema],

    labourCharge: { type: Number, default: 0 },
    wheelAlignmentCharge: { type: Number, default: 0 },
    wheelBalanceCharge: { type: Number, default: 0 },
    partsTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    status: { type: String, enum: ["in_progress", "completed"], default: "completed" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Business logic: compute totals from services + parts before saving
serviceVisitSchema.methods.computeTotals = function () {
  const bayServices = ["engine_oil_change", "gearbox_oil_change", "brake_fluid_change", "brake_pad_change", "greasing"];
  const hasBayService = this.services.some((s) => bayServices.includes(s));

  this.labourCharge = hasBayService ? LABOUR_CHARGE : 0;
  this.wheelAlignmentCharge = this.services.includes("wheel_alignment") ? WHEEL_ALIGNMENT_CHARGE : 0;
  this.wheelBalanceCharge = this.services.includes("wheel_balance") ? WHEEL_BALANCE_CHARGE : 0;

  if (!this.services.includes("other_repair")) this.otherRepairCharge = 0;

  this.partsTotal = this.partsUsed.reduce((sum, p) => sum + p.lineTotal, 0);

  this.grandTotal =
    this.partsTotal +
    this.labourCharge +
    this.wheelAlignmentCharge +
    this.wheelBalanceCharge +
    (this.otherRepairCharge || 0);
};

module.exports = mongoose.model("ServiceVisit", serviceVisitSchema);
module.exports.LABOUR_CHARGE = LABOUR_CHARGE;
module.exports.WHEEL_ALIGNMENT_CHARGE = WHEEL_ALIGNMENT_CHARGE;
module.exports.WHEEL_BALANCE_CHARGE = WHEEL_BALANCE_CHARGE;
module.exports.SERVICE_TYPES = SERVICE_TYPES;
