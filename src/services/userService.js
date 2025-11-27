const User = require("../models/User");
const { getExpiryDate } = require("../utils/subscription");

async function subscribeUser(chatId, username, type) {
  const expiry = getExpiryDate(type);

  const user = await User.findOneAndUpdate(
    { chatId },
    {
      username,
      subscriptionType: type,
      subscriptionExpires: expiry,
      status: "active",
    },
    { new: true, upsert: true }
  );

  return user;
}

module.exports = { subscribeUser };
