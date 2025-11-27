const mongoose = require("mongoose");

const VoucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false },
  usedBy: { type: String, default: null }, // chatId
  usedAt: { type: Date, default: null }
});

module.exports = mongoose.model("Voucher", VoucherSchema);
