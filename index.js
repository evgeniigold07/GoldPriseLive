const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const { Telegraf } = require("telegraf");
const fetch = require("node-fetch");

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

async function getGoldPrice() {
  try {
    const response = await fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_API_KEY}`);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return null;
  }
}

let lastPrice = null;

async function sendPriceUpdate() {
  const price = await getGoldPrice();

  // Проверка времени: только в будни с 06:00 до 23:00 по CET (Норвегия)
  const now = new Date();
  const hour = now.getUTCHours() + 2; // CET = UTC+2
  const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

  if (day === 0 || day === 6 || hour < 6 || hour >= 23 || price === null) return;

  if (price !== lastPrice) {
    const emoji = price > lastPrice ? "🟢" : "🔴";
    lastPrice = price;

    const hashtags = "#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets";
    const message = `${emoji} XAU/USD: $${price}\n${hashtags}`;

    await bot.telegram.sendMessage(CHANNEL_ID, message);
  }
}

setInterval(sendPriceUpdate, 5 * 60 * 1000); // каждые 5 минут

bot.launch();
