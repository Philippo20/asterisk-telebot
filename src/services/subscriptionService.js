const User = require("../models/User");

function isSubscribed(user) {
  return user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date();
}

async function extendSubscription(userId, days = 1) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = new Date();
  const base = user.subscriptionExpiresAt > now ? user.subscriptionExpiresAt : now;

  user.subscriptionExpiresAt = new Date(base.getTime() + days * 86400000);
  user.isActive = true;
  await user.save();
  return user;
}

module.exports = { isSubscribed, extendSubscription };
