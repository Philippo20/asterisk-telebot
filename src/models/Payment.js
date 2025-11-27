const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  currency: String,
  gateway: String,
  status: { type: String, default: "pending" },
  reference: String,
  meta: Object,
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
