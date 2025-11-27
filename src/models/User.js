const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,

  // subscription: daily, weekly, monthly
  subscriptionType: {
    type: String,
    enum: ["daily", "weekly", "monthly", "none"],
    default: "none",
  },

  // subscription validity date
  subscriptionExpires: {
    type: Date,
    default: null,
  },

  // if user has been notified before expiry
  notifiedBeforeExpiry: { 
    type: Boolean, 
    default: false 
  },

  // if user is suspended or banned
  status: {
    type: String,
    enum: ["active", "inactive", "banned"],
    default: "active",
  },

  // track extensions created by user
  extensions: [
    {
      ext: String,
      secret: String,
      callerid: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
