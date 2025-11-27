require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");

//const paymentWebhook = require("./src/routes/paymentWebhook");
// 🟢 IMPORTANT: Your bot file already launches the bot,
// handles SSH, cron jobs, and DB logic.

require("../index"); 
const app = express();
app.use(bodyParser.json());


// Payment webhook route
//app.use("/", paymentWebhook);

async function startServer() {
  console.log("🌿 Starting Server…");
  // Start Express API server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`🚀 Express Server running on port ${PORT}`)
  );
}

startServer();
