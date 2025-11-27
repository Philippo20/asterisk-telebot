require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const bot = require("./bot/bot");
const paymentWebhook = require("./routes/paymentWebhook");

const app = express();
app.use(bodyParser.json());
app.use("/", paymentWebhook);

async function start() {
  await connectDB();
  app.listen(process.env.PORT || 3000, () => console.log("Server running"));
  bot.launch();
  console.log("Telegram bot running");
}

start();
