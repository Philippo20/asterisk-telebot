require("dotenv").config();
const { Telegraf, Markup, session } = require("telegraf");

const Admin = require("./src/models/Admin");
const User = require("./src/models/User");
const UserExtension = require("./src/models/UserExtension");
const BlockedUser = require("./src/models/BlockedUser");

const {
  handleStart,
  showUserMenu,
  showAdminMenu
} = require("./src/controllers/userController");

const {
  handleAddUser,
  handleAddAdmin,
  handleRemoveAdmin,
  handleBlockUser
} = require("./src/controllers/adminController");

const {
  handleCreateExtension,
  handleUpdateCallerID,
  handleMyExtension
} = require("./src/controllers/extensionController");

const {
  handleSubscriptionMenu,
  handlePlanDaily,
  handlePlanWeekly,
  handlePlanMonthly,
  handleRedeemVoucher
} = require("./src/controllers/subscriptionController");

// ===============================
// BOT SETUP
// ===============================
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

console.log("🤖 Telegram bot initialized");

// ===============================
// BLOCKED USER MIDDLEWARE
// ===============================
bot.use(async (ctx, next) => {
  if (!ctx.message) return next();
  const chatId = ctx.chat.id.toString();

  const blocked = await BlockedUser.findOne({ chatId });
  if (blocked) {
    return ctx.reply("🚫 You are blocked from using this service.");
  }

  return next();
});

// ===============================
// START COMMAND
// ===============================
bot.start(handleStart);

// ===============================
// USER MENUS
// ===============================
bot.hears("⬅️ Back", showUserMenu);
bot.hears("📋 My Account", showUserMenu);
bot.hears("📋 My Extension", handleMyExtension);

// ===============================
// SUBSCRIPTION MENU
// ===============================
bot.hears("💳 Subscribe", handleSubscriptionMenu);
bot.hears(/🕐 Daily/, handlePlanDaily);
bot.hears(/📆 Weekly/, handlePlanWeekly);
bot.hears(/🗓 Monthly/, handlePlanMonthly);
bot.hears("🎟 Redeem Voucher", handleRedeemVoucher);

// ===============================
// ADMIN MENU
// ===============================
bot.hears("👥 Manage Users", showAdminMenu);
bot.hears("➕ Add User", handleAddUser);
bot.hears("➕ Add Admin", handleAddAdmin);
bot.hears("🗑 Remove Admin", handleRemoveAdmin);
bot.hears("🚫 Block Users", handleBlockUser);

// ===============================
// EXTENSION MANAGEMENT
// ===============================
bot.hears("📞 Create Extension", handleCreateExtension);
bot.hears("✏️ Update Caller ID", handleUpdateCallerID);

// ===============================
// EXPORT BOT
// ===============================
module.exports = bot;
