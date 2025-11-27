require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const connectDB = require("./src/config/db");
const Admin = require("./src/models/Admin");
const { runSSHCommand } = require("./src/services/sshService");
const SubscriptionPrice = require("./src/models/SubscriptionPrice");
const User = require("./src/models/User");
const Voucher = require("./src/models/Voucher");
const UserExtension = require("./src/models/UserExtension");
const BlockedUser = require("./src/models/BlockedUser");
const AsteriskManager = require("./src/services/createExtensionService");



function generateVoucherCode(prefix) {
  return prefix.toUpperCase() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function calcExpiry(type) {
  const now = new Date();
  if (type === "daily") now.setDate(now.getDate() + 1);
  if (type === "weekly") now.setDate(now.getDate() + 7);
  if (type === "monthly") now.setDate(now.getDate() + 30);

  return now;
}

// ===============================
// STARTUP: DATABASE CONNECTION
// ===============================
console.log("🌿 Connecting to MongoDB...");
connectDB().then(() => console.log("🍃 MongoDB Connected!"));

// ===============================
// STARTUP: SSH CONNECTION TEST
// ===============================
console.log("🔌 Testing SSH Connection...");
runSSHCommand("echo SSH_OK")
  .then((res) => {
    if (res.includes("SSH_OK")) {
      console.log("🔑 SSH Connected Successfully!");
    } else {
      console.log("❌ SSH Connection Failed! Response:", res);
    }
  })
  .catch((err) => {
    console.log("❌ SSH Error:", err.message);
  });

// ===============================
// CREATE TELEGRAM BOT INSTANCE
// ===============================
const bot = new Telegraf(process.env.BOT_TOKEN);
const LocalSession = require("telegraf-session-local");
bot.use(new LocalSession({ database: "sessions.json" }).middleware());

console.log("🤖 Telegram bot started");


// ===============================
// START COMMAND HANDLER
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

bot.start(async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username || "NoUsername";

  const isAdmin = await Admin.exists({ chatId });

  if (isAdmin) {
    // ADMIN INTERFACE
    return ctx.reply(
      `🤖 Admin Panel — JOKER SIP Manager

You have full system access.

Admin Tools:
• Create SIP/PJSIP extensions
• Update caller IDS
• Delete extensions
• Manage users
• Handle subscriptions

Logged in as:
• Admin Username: ${username}
• Chat ID: ${chatId}

Choose an option:`,
      Markup.keyboard([
        ["👥 Manage Users", "💳 Subscription Dashboard"],
        ["📞 Create Extension", "✏️ Update Caller ID"],
        ["🗑 Delete Extension", "📋 View Extensions"],
      ]).resize()
    );
  }

  // USER INTERFACE
  return ctx.reply(
    `🤖 Welcome to JOKER SIP Manager

Create and manage SIP extensions directly from Telegram.

Your Account:
• Username: ${username}
• Chat ID: ${chatId}
• Subscription: Use /subscribe to activate

Features:
• Get SIP extension
• Update caller ID
• View your Account

Choose an option:`,
    Markup.keyboard([
      ["💳 Subscribe", "📋 My Account"],
      ["📋 My Extension", "✏️ Update Caller ID"],
      ["🎟 redeem voucher"],

    ]).resize()
  );
});


// ===============================
// back to admin menu
// ===============================
bot.hears("⬅️ Back to Admin Menu", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  return ctx.reply(
    `🤖 Admin Panel — JOKER SIP Manager

You have full system access.

Choose an option:`,
    Markup.keyboard([
      ["👥 Manage Users", "💳 Subscription Dashboard"],
      ["📞 Create Extension", "✏️ Update Caller ID"],
      ["🗑 Delete Extension", "📋 View Extensions"],
    ]).resize()
  );
});

bot.hears("⬅️ Back", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username || "NoUsername";

  return ctx.reply(
    `🤖 Welcome back, ${username}

Choose an option:`,
    Markup.keyboard([
      ["💳 Subscribe", "📋 My Account"],
      ["📋 My Extension", "✏️ Update Caller ID"],
      ["🎟 redeem voucher"],
    ]).resize()
  );
});



// ===============================
// USER BUTTON HANDLERS
// ===============================

bot.hears(/🕐 Daily/, async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username || "NoUsername";

  // Notify all admins
  const admins = await Admin.find({});
  admins.forEach(async (admin) => {
    try {
      await bot.telegram.sendMessage(
        admin.chatId,
        `🔔 *New Subscription Request*\n\n` +
        `👤 User: @*${username}*\n` +
        `🆔 Chat ID: *${chatId}*\n` +
        `💳 Selected Plan: *Daily*\n`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {}
  });

  return ctx.reply(
    "🕐 You selected the *Daily* plan.\n" +
    "An admin will contact you shortly.",
    { parse_mode: "Markdown" }
  );
});

bot.hears(/📆 Weekly/, async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username || "NoUsername";

  const admins = await Admin.find({});
  admins.forEach(async (admin) => {
    try {
      await bot.telegram.sendMessage(
        admin.chatId,
        `🔔 *New Subscription Request*\n\n` +
        `👤 User: @*${username}*\n` +
        `🆔 Chat ID: *${chatId}*\n` +
        `💳 Selected Plan: *Weekly*\n`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {}
  });

  return ctx.reply(
    "📆 You selected the *Weekly* plan.\n" +
    "An admin will contact you shortly.",
    { parse_mode: "Markdown" }
  );
});


bot.hears(/🗓 Monthly/, async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username || "NoUsername";

  const admins = await Admin.find({});
  admins.forEach(async (admin) => {
    try {
      await bot.telegram.sendMessage(
        admin.chatId,
        `🔔 *New Subscription Request*\n\n` +
        `👤 User: @*${username}*\n` +
        `🆔 Chat ID: *${chatId}*\n` +
        `💳 Selected Plan: *Monthly*\n`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {}
  });

  return ctx.reply(
    "🗓 You selected the *Monthly* plan.\n" +
    "An admin will contact you shortly.",
    { parse_mode: "Markdown" }
  );
});



bot.hears("📋 My Extension", async (ctx) => {
  const chatId = ctx.chat.id.toString();

  // Check if user even exists
  const user = await User.findOne({ chatId });
  if (!user) {
    return ctx.reply("❌ You are not registered as a user.");
  }

  // Check if extension assigned
  const userExt = await UserExtension.findOne({ chatId });
  if (!userExt) {
    return ctx.reply(
      "📭 You currently do not have an extension.\n" +
      "Redeem a voucher or subscribe to get one."
    );
  }

  // Check subscription
  let isActive = false;
  let expiryText = "N/A";

  if (user.subscriptionExpires) {
    isActive = user.subscriptionExpires > new Date();
    expiryText = user.subscriptionExpires.toLocaleString();
  }
  
  return ctx.reply(
  `📋 *Your Extension Details*\n\n` +
  `📞 *Extension:* \n\`${userExt.extension}\`\n\n` +
  `🔑 *Password:* \n\`${userExt.password}\`\n\n` +
  `🌎 *IP Address:* ${process.env.SSH_HOST}\n\n` +
  `🆔 *Caller ID:* ${userExt.callerID}\n\n` +
  `💳 *Plan:* ${user.subscriptionType || "No subscription"}\n` +
  `⏳ *Expires:* ${expiryText}\n` +
  `📌 *Status:* ${isActive ? "🟢 Active" : "🔴 Expired"}\n\n` +
  `Tap the code boxes above to copy.`,
  { parse_mode: "Markdown" }
);
  
});


bot.hears("🎟 redeem voucher", (ctx) => {
  ctx.reply(
    "🎟 Enter your voucher code:\n\nExample:\n`DAY-ABCD1234`\nor\n`WEEK-XYZ98765`\n\nSend ONLY the code:",
    { parse_mode: "Markdown" }
  );

  ctx.session = { waitingForVoucher: true };
});

bot.hears("💳 Subscribe", async (ctx) => {
  const prices = await SubscriptionPrice.findOne();

  return ctx.reply(
    `📅 Choose your subscription plan:

    🕐 Daily — $${prices.daily}
    📆 Weekly — $${prices.weekly}
    🗓 Monthly — $${prices.monthly}`,
        Markup.keyboard([
          [`🕐 Daily ($${prices.daily})`, `📆 Weekly ($${prices.weekly})`],
          [`🗓 Monthly ($${prices.monthly})`],
          ["⬅️ Back"]
    ]).resize()
  );
});

bot.hears("📞 Create Extension", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  ctx.reply("📞 Enter the *extension number*:");
  ctx.session = { step: "createExt_number" };
});


bot.hears("✏️ Update Caller ID", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });

  if (isAdmin) {
    ctx.reply("✏️ Admin: Enter the *extension number* you want to update:");
    ctx.session = { step: "adminUpdateCaller_ext" };
    return;
  }

  // USER FLOW
  const userExt = await UserExtension.findOne({ chatId });

  if (!userExt) {
    return ctx.reply("❌ You do not have any extension assigned.");
  }

  ctx.reply(
    `✏️ Your current Caller ID: *${userExt.callerId}*\n\n` +
    `Enter your *new Caller ID*:`,
    { parse_mode: "Markdown" }
  );

  ctx.session = {
    step: "userUpdateCaller",
    ext: userExt.extension
  };
});


bot.hears("🗑 Delete Extension", (ctx) => {
  ctx.reply("Send:\n/delete_ext EXT");
});

bot.hears("📋 My Account", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username || "NoUsername";

  const user = await User.findOne({ chatId });

  if (!user || !user.subscriptionType) {
    return ctx.reply(
      `📋 *My Account*

👤 Username: @${username}
🆔 Chat ID: ${chatId}

🔔 Subscription Status: *No active subscription*
👉 Use *💳 Subscribe* or redeem a voucher.

`,
      { parse_mode: "Markdown" }
    );
  }

  // Check if expired
  const now = new Date();
  const expires = new Date(user.subscriptionExpires);

  let status = "";
  if (expires > now) {
    status = "🟢 *Active*";
  } else {
    status = "🔴 *Expired*";
  }

  // Remaining days
  const diffMs = expires - now;
  const remainingDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

  return ctx.reply(
    `📋 *My Account*

👤 Username: @${username}
🆔 Chat ID: ${chatId}

🔐 Subscription Type: *${user.subscriptionType.toUpperCase()}*
⏳ Expires On: *${expires.toLocaleString()}*
📆 Days Remaining: *${remainingDays}*
📌 Status: ${status}

`,
    { parse_mode: "Markdown" }
  );
});



// ===============================
// ADMIN BUTTON HANDLERS
// ===============================


bot.hears("🚫 Block Users", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const admin = await Admin.findOne({ chatId });
  if (!admin) return;

  ctx.reply("🚫 Enter the *Chat ID* of the user to block:");
  ctx.session = { step: "blockUser_chatId" };
});


bot.hears("🗑 Remove Admin", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const admin = await Admin.findOne({ chatId });
  if (!admin) return;

  ctx.reply("🗑 Enter the *Chat ID* of the admin to remove:");
  ctx.session = { step: "removeAdmin_chatId" };
});


bot.hears("➕ Add Admin", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  ctx.reply("👑 Enter the *Chat ID* of the new admin:");
  ctx.session = { step: "addAdmin_chatId" };
});


bot.hears("➕ Add User", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  ctx.reply("👤 Enter the user's *Chat ID*:");
  ctx.session = { step: "addUser_chatId" };
});

bot.hears("📋 View All Users", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  const users = await User.find({});

  if (!users || users.length === 0) {
    return ctx.reply("📋 No users found in the system.");
  }

  let msg = "📋 *Registered Users*\n\n";

  users.forEach((user, index) => {
    const expires = user.subscriptionExpires
      ? new Date(user.subscriptionExpires)
      : null;

    let status = "❌ No Subscription";
    let expiryString = "N/A";

    if (expires) {
      expiryString = expires.toLocaleString();
      status = expires > new Date() ? "🟢 Active" : "🔴 Expired";
    }

    msg += `#${index + 1}\n`;
    msg += `• Username: *${user.username || "N/A"}*\n`;
    msg += `• Chat ID: *${user.chatId}*\n`;
    msg += `• Plan: *${user.subscriptionType || "None"}*\n`;
    msg += `• Expires: ${expiryString}\n`;
    msg += `• Status: ${status}\n\n`;
  });

  return ctx.reply(msg, { parse_mode: "Markdown" });
});


bot.hears("👥 Manage Users", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });

  if (!isAdmin) return; // ignore if not admin

  return ctx.reply(
    `👥 User Management

Choose what you want to manage:`,
    Markup.keyboard([
      ["📋 View All Users", "👑 View Admins"],
      ["➕ Add User", "➕ Add Admin"],
      ["🗑 Remove Admin", "🚫 Block Users"],
      ["⬅️ Back to Admin Menu"]
    ]).resize()
  );
});

bot.hears("💳 Subscription Dashboard", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  return ctx.reply(
    `💳 Subscription Dashboard

Choose an option:`,
    Markup.keyboard([
      ["📋 View Subscriptions", "💰 Sales"],
      ["🎟 Generate daily Sub", "🎟 Generate Weekly Sub", "🎟 Generate Monthly sub"],
      ["⬅️ Back to Admin Menu"]
    ]).resize()
  );
});

bot.hears("📋 View Extensions", async (ctx) => {
  const isAdmin = await Admin.exists({ chatId: ctx.chat.id.toString() });
  if (!isAdmin) return;
  ctx.reply("Admin: Fetching all extensions...");
});

bot.hears("📋 View Subscriptions", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  const prices = await SubscriptionPrice.findOne();

  // Count users by subscription
  const dailyUsers = await User.countDocuments({ subscriptionType: "daily" });
  const weeklyUsers = await User.countDocuments({ subscriptionType: "weekly" });
  const monthlyUsers = await User.countDocuments({ subscriptionType: "monthly" });

  return ctx.reply(
    `📋 Subscription Overview

Current Prices:
• Daily: $${prices.daily}
• Weekly: $${prices.weekly}
• Monthly: $${prices.monthly}

Active Users:
• Daily Users: ${dailyUsers}
• Weekly Users: ${weeklyUsers}
• Monthly Users: ${monthlyUsers}

Choose an option below:`,
    Markup.keyboard([
      ["🔧 Edit Daily Price"],
      ["🔧 Edit Weekly Price"],
      ["🔧 Edit Monthly Price"],
      ["⬅️ Back to Admin Menu"]
    ]).resize()
  );
});

bot.hears("👑 View Admins", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  const admins = await Admin.find({});

  if (!admins.length) {
    return ctx.reply("❌ No admins found in the system.");
  }

  let msg = "👑 *Registered Admins*\n\n";

  admins.forEach((admin, index) => {
    msg += `#${index + 1}\n`;
    msg += `• Username: *${admin.username || "N/A"}*\n`;
    msg += `• Chat ID: *${admin.chatId}*\n`;
    msg += `• Role: *${admin.role || "admin"}*\n\n`;
  });

  return ctx.reply(msg, { parse_mode: "Markdown" });
});

// ===============================
// Subscription Generator handlers
// ===============================
bot.hears("🎟 Generate daily Sub", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  const code = generateVoucherCode("DAY");

  await Voucher.create({
    code,
    type: "daily"
  });

  return ctx.reply(
    `🎟 Daily Subscription Voucher Generated

Code: *${code}*
Type: Daily

Share this code with a user to redeem.`,
    { parse_mode: "Markdown" }
  );
});

bot.hears("🎟 Generate Weekly Sub", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  const code = generateVoucherCode("WEEK");

  await Voucher.create({
    code,
    type: "weekly"
  });

  return ctx.reply(
    `🎟 Weekly Subscription Voucher Generated

Code: *${code}*
Type: Weekly

Share this code with a user to redeem.`,
    { parse_mode: "Markdown" }
  );
});


bot.hears("🎟 Generate Monthly sub", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const isAdmin = await Admin.exists({ chatId });
  if (!isAdmin) return;

  const code = generateVoucherCode("MONTH");

  await Voucher.create({
    code,
    type: "monthly"
  });

  return ctx.reply(
    `🎟 Monthly Subscription Voucher Generated

Code: *${code}*
Type: Monthly

Share this code with a user to redeem.`,
    { parse_mode: "Markdown" }
  );
});


// ===============================
// PRICE EDITING HANDLERS
// ===============================
bot.hears("🔧 Edit Daily Price", (ctx) => {
  ctx.reply("Enter new DAILY price:");
  ctx.session = { waitingFor: "dailyPrice" };
});

bot.hears("🔧 Edit Weekly Price", (ctx) => {
  ctx.reply("Enter new WEEKLY price:");
  ctx.session = { waitingFor: "weeklyPrice" };
});

bot.hears("🔧 Edit Monthly Price", (ctx) => {
  ctx.reply("Enter new MONTHLY price:");
  ctx.session = { waitingFor: "monthlyPrice" };
});





// ===============================
// TEXT INPUT HANDLER (FOR PRICE UPDATES)
// ===============================
bot.on("text", async (ctx) => {
  ctx.session = ctx.session || {};
  const chatId = ctx.chat.id.toString();
  const text = ctx.message.text.trim();

  // =====================================
  // 1) USER REDEEMING VOUCHER
  // =====================================
  if (ctx.session.waitingForVoucher) {
    ctx.session.waitingForVoucher = false; // clear flag

    const code = text.toUpperCase();

    const voucher = await Voucher.findOne({ code });
    if (!voucher) {
      return ctx.reply("❌ Invalid voucher code. Please check and try again.");
    }

    if (voucher.used) {
      return ctx.reply("❌ This voucher has already been used.");
    }

    // Check if user already has an extension
    const existingExt = await UserExtension.findOne({ chatId });
    if (existingExt) {
      return ctx.reply("❌ You already have an extension. One user can only have one extension.");
    }

    // Activate subscription
    const expiry = calcExpiry(voucher.type);

    await User.findOneAndUpdate(
      { chatId },
      {
        subscriptionType: voucher.type,
        subscriptionExpires: expiry
      },
      { upsert: true }
    );

    // Generate extension credentials
    const ext = "7" + Math.floor(1000 + Math.random() * 9000); // e.g. 7XXXX
    const secret = Math.random().toString(36).substring(2, 10).toUpperCase();
    const callerId = `<${chatId}>`;

    try {
      await AsteriskManager.createExtension(ext, secret, callerId);
    } catch (err) {
      console.error("AsteriskManager error:", err);
      return ctx.reply("❌ Failed to create SIP extension. Please contact support.");
    }

    // Save extension in DB
    await UserExtension.create({
      chatId,
      extension: ext,
      password: secret,
      callerId: callerId
    });

    // Mark voucher used
    voucher.used = true;
    voucher.usedBy = chatId;
    voucher.usedAt = new Date();
    await voucher.save();

    return ctx.reply(
      `✅ Voucher redeemed successfully!

      Your SIP extension details:

      Extension: ${ext}
      Password: ${secret}
      Caller ID: ${callerId}
      Expires: ${expiry.toLocaleString()}

      You can also view this anytime with:
      📋 My Extension`
    );
  }

  // =====================================
  // 2) ADMIN EDITING PRICES (if you use ctx.session.waitingFor)
  // =====================================
  if (ctx.session.waitingFor) {
    const newPrice = Number(text);
    if (isNaN(newPrice)) {
      return ctx.reply("❌ Invalid number. Please send only a number.");
    }

    const prices = await SubscriptionPrice.findOne();

    if (ctx.session.waitingFor === "dailyPrice") {
      prices.daily = newPrice;
      await prices.save();
      ctx.reply(`✅ Daily price updated to $${newPrice}`);
    }

    if (ctx.session.waitingFor === "weeklyPrice") {
      prices.weekly = newPrice;
      await prices.save();
      ctx.reply(`✅ Weekly price updated to $${newPrice}`);
    }

    if (ctx.session.waitingFor === "monthlyPrice") {
      prices.monthly = newPrice;
      await prices.save();
      ctx.reply(`✅ Monthly price updated to $${newPrice}`);
    }

    ctx.session.waitingFor = null;
    return;
  }

  // ===============================
  // ADD USER FLOW
  // ===============================
  if (ctx.session?.step === "addUser_chatId") {
    const newChatId = ctx.message.text.trim();

    if (isNaN(newChatId)) {
      return ctx.reply("❌ Invalid chat ID. Enter numbers only.");
    }

    ctx.session.newUser = { chatId: newChatId };
    ctx.session.step = "addUser_username";

    return ctx.reply("👤 Enter the user's *username*:");
  }

  if (ctx.session?.step === "addUser_username") {
    const username = ctx.message.text.trim();

    ctx.session.newUser.username = username;

    // Save into User collection
    await User.findOneAndUpdate(
      { chatId: ctx.session.newUser.chatId },
      { username, subscriptionType: null },
      { upsert: true }
    );

    ctx.reply(
      `✅ User added successfully!

    Chat ID: *${ctx.session.newUser.chatId}*
    Username: *${username}*`,
      { parse_mode: "Markdown" }
    );

    ctx.session = null;
    return;
  }

  // ===============================
  // ADD ADMIN FLOW (UPDATED)
  // ===============================
  if (ctx.session?.step === "addAdmin_chatId") {
    const newChatId = ctx.message.text.trim();

    if (isNaN(newChatId)) {
      return ctx.reply("❌ Invalid chat ID. Enter numbers only.");
    }

    // CHECK IF ALREADY ADMIN
    const exists = await Admin.findOne({ chatId: newChatId });
    if (exists) {
      ctx.session = null;
      return ctx.reply("⚠️ This Chat ID is already an admin.");
    }

    // OPTIONAL: CHECK IF BLOCKED USER
    const isBlocked = await BlockedUser.findOne({ chatId: newChatId });
    if (isBlocked) {
      ctx.session = null;
      return ctx.reply("🚫 This user is blocked and cannot be added as admin.");
    }

    ctx.session.newAdmin = { chatId: newChatId };
    ctx.session.step = "addAdmin_username";

    return ctx.reply("👑 Enter the admin's *username*:");
  }

  if (ctx.session?.step === "addAdmin_username") {
    const username = ctx.message.text.trim();
    const chatId = ctx.session.newAdmin.chatId;

    // FINAL CHECK BEFORE SAVING
    const exists = await Admin.findOne({ chatId });
    if (exists) {
      ctx.session = null;
      return ctx.reply("⚠️ This Chat ID is already an admin.");
    }

    // SAVE ADMIN
    await Admin.create({
      chatId,
      username,
      role: "admin"
    });

    ctx.reply(
      `✅ Admin added successfully!

👑 Username: *${username}*
🆔 Chat ID: *${chatId}*
Role: *admin*`,
      { parse_mode: "Markdown" }
    );

    ctx.session = null;
    return;
  }


  // ===============================
  // REMOVE ADMIN FLOW
  // ===============================
  if (ctx.session?.step === "removeAdmin_chatId") {
    const removeId = ctx.message.text.trim();
    const requestingAdminId = ctx.chat.id.toString();

    if (isNaN(removeId)) {
      return ctx.reply("❌ Invalid chat ID. Enter digits only.");
    }

    const adminToRemove = await Admin.findOne({ chatId: removeId });
    if (!adminToRemove) {
      ctx.session = null;
      return ctx.reply("❌ No admin found with that Chat ID.");
    }

    // Prevent removing superadmin
    if (adminToRemove.role === "superadmin") {
      ctx.session = null;
      return ctx.reply("❌ You cannot remove the superadmin.");
    }

    // Prevent admin removing themselves
    if (removeId === requestingAdminId) {
      ctx.session = null;
      return ctx.reply("❌ You cannot remove your own admin account.");
    }

    await Admin.deleteOne({ chatId: removeId });

    ctx.session = null;

    return ctx.reply(
      `🗑 Admin removed successfully!
    
      Removed Chat ID: *${removeId}*`,
      { parse_mode: "Markdown" }
    );
  }

  // ===============================
  // BLOCK USER FLOW 
  // ===============================
  if (ctx.session?.step === "blockUser_chatId") {
    const blockId = ctx.message.text.trim();

    if (isNaN(blockId)) {
      return ctx.reply("❌ Invalid Chat ID. Enter digits only.");
    }

    // Check if already blocked
    const exists = await BlockedUser.findOne({ chatId: blockId });
    if (exists) {
      ctx.session = null;
      return ctx.reply("⚠️ This user is already blocked.");
    }

    // 1️⃣ GET USER EXTENSION (if exists)
    const userExt = await UserExtension.findOne({ chatId: blockId });

    if (userExt) {
      // 2️⃣ DELETE EXTENSION FROM ASTERISK
      try {
        await AsteriskManager.deleteExtension(userExt.extension);
      } catch (err) {
        console.log("❌ Error deleting extension from Asterisk:", err.message);
      }

      // 3️⃣ DELETE EXTENSION FROM DB
      await UserExtension.deleteOne({ chatId: blockId });
    }

    // 4️⃣ BLOCK USER
    await BlockedUser.create({
      chatId: blockId,
      reason: "Blocked by admin"
    });

    ctx.session = null;

    return ctx.reply(
      `🚫 User Blocked Successfully!

      Blocked Chat ID: *${blockId}*
      Extension Removed: *${userExt ? userExt.extension : "None"}*`,
      { parse_mode: "Markdown" }
    );
  }

  // ===============================
  // CREATE EXTENSION FLOW
  // ===============================
  if (ctx.session?.step === "createExt_number") {
    const ext = ctx.message.text.trim();

    if (isNaN(ext)) {
      return ctx.reply("❌ Extension must be numbers only. Try again:");
    }

    ctx.session.newExt = { ext };
    ctx.session.step = "createExt_password";

    return ctx.reply("🔑 Enter the *SIP password*:");
  }

  if (ctx.session?.step === "createExt_password") {
    const password = ctx.message.text.trim();

    if (password.length < 4) {
      return ctx.reply("❌ Password too short. Enter a longer password:");
    }

    ctx.session.newExt.password = password;
    ctx.session.step = "createExt_callerid";

    return ctx.reply("📞 Enter the *Caller ID*\nExample: 233550000000 or John <233550000000>");
  }

  if (ctx.session?.step === "createExt_callerid") {
    const callerid = ctx.message.text.trim();
    const { ext, password } = ctx.session.newExt;

    // CREATE EXTENSION USING ASTERISK MANAGER
    try {
      await AsteriskManager.createExtension(ext, password, callerid);
    } catch (err) {
      console.error("❌ Asterisk Extension Creation Error:", err);

      ctx.session = null;

      return ctx.reply(
        "❌ Failed to create extension in Asterisk.\n" +
        "Check server logs for more details."
      );
    }


    // SAVE INTO DATABASE
    await UserExtension.create({
      chatId: ctx.chat.id.toString(),
      extension: ext,
      password,
      callerID: callerid
    });

    ctx.reply(
      `✅ *Extension Created Successfully!*

      📞 Extension: *${ext}*
      🔑 Password: *${password}*
      🆔 Caller ID: *${callerid}*
      🌎 IP Address: *${process.env.SSH_HOST}*

      Extension is now active in FreePBX.`,
      { parse_mode: "Markdown" }
    );

    ctx.session = null;
    return;
  }

  if (ctx.session?.step === "adminUpdateCaller_ext") {
    const ext = ctx.message.text.trim();

    if (isNaN(ext)) {
      return ctx.reply("❌ Invalid extension number. Enter digits only.");
    }

    ctx.session.ext = ext;
    ctx.session.step = "adminUpdateCaller_newID";

    return ctx.reply("✏️ Enter the *new Caller ID*:");
  }

  if (ctx.session?.step === "adminUpdateCaller_newID") {
    const newCallerID = ctx.message.text.trim();
    const ext = ctx.session.ext;

    try {
      await AsteriskManager.updateCallerID(ext, newCallerID);
    } catch (err) {
      console.error("❌ Caller ID update error:", err);
      ctx.session = null;
      return ctx.reply("❌ Failed to update Caller ID in Asterisk.");
    }

    // Update DB if extension exists in DB
    await UserExtension.findOneAndUpdate(
      { extension: ext },
      { callerID: newCallerID }
    );

    ctx.session = null;

    return ctx.reply(
      `✅ Caller ID updated successfully!

📞 Extension: *${ext}*
🆔 New Caller ID: *${newCallerID}*`,
      { parse_mode: "Markdown" }
    );
  }

  if (ctx.session?.step === "userUpdateCaller") {
    const newCallerID = ctx.message.text.trim();
    const ext = ctx.session.ext;
    const chatId = ctx.chat.id.toString();

    const user = await User.findOne({ chatId });

    if (!user || !user.subscriptionExpires || user.subscriptionExpires <= new Date()) {
      ctx.session = null;
      return ctx.reply("❌ Your subscription is expired. Renew to update Caller ID.");
    }

    try {
      await AsteriskManager.updateCallerID(ext, newCallerID);
    } catch (err) {
      console.error("❌ Caller ID update error:", err);
      ctx.session = null;
      return ctx.reply("❌ Failed to update Caller ID in Asterisk.");
    }

    await UserExtension.findOneAndUpdate(
      { chatId },
      { callerId: newCallerID }
    );

    ctx.session = null;

    return ctx.reply(
      `✅ Caller ID updated successfully!

📞 Extension: *${ext}*
🆔 New Caller ID: *${newCallerID}*`,
      { parse_mode: "Markdown" }
    );
  }


});

// ===============================
// 1-DAY BEFORE EXPIRY WARNING
// Runs every 6 hours
// ===============================
setInterval(async () => {
  console.log("⏱ Checking for subscriptions expiring in 24 hours...");

  const now = new Date();
  const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find users expiring tomorrow AND not yet notified
  const users = await User.find({
    subscriptionExpires: {
      $gte: dayFromNow - 60 * 60 * 1000, // -1 hr tolerance
      $lte: dayFromNow + 60 * 60 * 1000  // +1 hr tolerance
    },
    notifiedBeforeExpiry: false
  });

  if (users.length === 0) {
    console.log("⏱ No users expiring in 24 hours.");
    return;
  }

  for (let user of users) {
    const chatId = user.chatId;

    // SEND WARNING
    try {
      await bot.telegram.sendMessage(
        chatId,
        "⏳ *Your subscription expires in 24 hours!*\n\n" +
        "Renew now to avoid losing access to your SIP extension.",
        { parse_mode: "Markdown" }
      );

      console.log(`🔔 Sent 1-day expiry warning to ${chatId}`);
    } catch (err) {
      console.log(`⚠️ Could not notify user ${chatId}`);
    }

    // Mark as notified
    await User.updateOne(
      { chatId },
      { $set: { notifiedBeforeExpiry: true } }
    );
  }
}, 6 * 60 * 60 * 1000); // Runs every 6 hours


// ===============================
// AUTO DELETE EXPIRED EXTENSIONS
// Runs every 5 minutes
// ===============================
setInterval(async () => {
  console.log("⏱ Checking for expired subscriptions...");

  const now = new Date();

  // Find expired users
  const expiredUsers = await User.find({
    subscriptionExpires: { $lte: now }
  });

  if (expiredUsers.length === 0) {
    console.log("⏱ No expired users found.");
    return;
  }

  for (let user of expiredUsers) {
    const chatId = user.chatId;
    const userExt = await UserExtension.findOne({ chatId });

    if (userExt) {
      // DELETE EXTENSION FROM ASTERISK
      try {
        await AsteriskManager.deleteExtension(userExt.extension);
        console.log(`🗑 Deleted expired extension ${userExt.extension} for ${chatId}`);
      } catch (err) {
        console.log("❌ Error deleting extension:", err.message);
      }

      // DELETE FROM DB
      await UserExtension.deleteOne({ chatId });
    }

    // REMOVE SUBSCRIPTION INFO
    await User.updateOne(
      { chatId },
      { $set: { subscriptionType: null, subscriptionExpires: null } }
    );

    // NOTIFY USER
    try {
      await bot.telegram.sendMessage(
        chatId,
        "⚠️ Your subscription has expired.\nYour SIP extension has been removed.\nRenew subscription to continue using the service."
      );
    } catch (err) {
      console.log(`⚠️ Could not notify user ${chatId}.`);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

// ===============================
// LAUNCH BOT
// ===============================
 bot.launch();
