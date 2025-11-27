const mongoose = require("mongoose");

const SubscriptionPriceSchema = new mongoose.Schema({
  daily: { type: Number, default: 1 },
  weekly: { type: Number, default: 5 },
  monthly: { type: Number, default: 10 }
});

module.exports = mongoose.model("SubscriptionPrice", SubscriptionPriceSchema);
