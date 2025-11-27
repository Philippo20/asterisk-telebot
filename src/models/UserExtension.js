const mongoose = require("mongoose");

const UserExtensionSchema = new mongoose.Schema({
  chatId: { type: String, required: true }, // Telegram user
  extension: { type: String, required: true },
  password: { type: String },
  callerId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserExtension", UserExtensionSchema);
