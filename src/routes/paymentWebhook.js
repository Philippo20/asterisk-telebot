const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const { extendSubscription } = require("../services/subscriptionService");
const User = require("../models/User");

router.post("/payment/webhook", async (req, res) => {
  const { reference, status, metadata } = req.body;

  if (status === "success") {
    const user = await User.findOne({ telegramId: metadata.telegramId });
    if (user) await extendSubscription(user._id, 1);

    await Payment.findOneAndUpdate({ reference }, { status: "paid" });
  }

  res.send("ok");
});

module.exports = router;
