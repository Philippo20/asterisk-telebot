const mongoose = require("mongoose");

const BlockedUserSchema = new mongoose.Schema({
  chatId: { type: String, unique: true },
  reason: { type: String, default: "No reason provided" },
  blockedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BlockedUser", BlockedUserSchema);
