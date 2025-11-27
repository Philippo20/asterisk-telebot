const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,
  role: {
    type: String,
    enum: ["superadmin", "admin"],
    default: "admin",
  },
});

module.exports = mongoose.model("Admin", AdminSchema);