const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const SubscriptionPrice = require("../models/SubscriptionPrice");


async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 MongoDB connected");

    // =========================================
    // AUTO-CREATE SUPERADMIN IF NOT EXISTS
    // =========================================
    const adminCount = await Admin.countDocuments();
    const MAIN_ADMIN_CHAT_ID = process.env.MAIN_ADMIN_CHAT_ID;

    if (adminCount === 0) {
      if (!MAIN_ADMIN_CHAT_ID) {
        console.log("⚠️ MAIN_ADMIN_CHAT_ID is missing in .env — cannot create first admin.");
      } else {
        await Admin.create({
          chatId: MAIN_ADMIN_CHAT_ID,
          username: "superadmin",
          role: "superadmin"
        });

        console.log(`👑 Superadmin created automatically → ${MAIN_ADMIN_CHAT_ID}`);
      }
    } else {
      console.log(`👥 Admins currently registered: ${adminCount}`);
    }
   
    const priceCount = await SubscriptionPrice.countDocuments();
    
    if (priceCount === 0) {
      await SubscriptionPrice.create({
        daily: 1,
        weekly: 5,
        monthly: 10
      });
      console.log("💵 Default subscription prices created");
    }
    else {
      console.log(`💵 Subscription prices currently registered: ${priceCount}`);
    }


  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
