const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
const fs = require("fs");
const { exec } = require("child_process");

// 🔑 Ключи
const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

// 💡 Проверка: моя версия активна!
console.log("💡 Моя версия бота активна!");

// 🕒 Проверка на выходные и ночное время
function isMarketOpen() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  if (
    (utcDay === 5 && utcHour >= 21) ||
    utcDay === 6 ||
    (utcDay === 0 && utcHour < 22)
  ) {
    return false;
  }

  return true;
}

// 🔢 Получение цены золота
async function getGoldPrice() {
  try {
    const url = `https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error("❌ Ошибка при получении цены:", error);
    return null;
  }
}

// 📷 Получение скриншота графика с TradingView
async function captureChartScreenshot() {
  const url =
    "https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD&interval=5";

  const cmd = `node screenshot.js "${url}"`;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Ошибка скриншота:", error);
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// 🤖 Бот
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

let lastPrice = 0;

async function sendPriceUpdate() {
  if (!isMarketOpen()) {
    console.log("⏳ Рынок закрыт — обновление не отправлено.");
    return;
  }

  const price = await getGoldPrice();
  if (!price) return;

  const direction = price > lastPrice ? "🟢" : "🔴";
  lastPrice = price;

  const message = `${direction} XAU/USD: $${price}\n\n#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets`;

  try {
    const screenshotPath = await captureChartScreenshot();
    bot.sendPhoto(CHANNEL_ID, screenshotPath, {
      caption: message,
    });
    console.log(`[✓] Отправлено: ${message}`);
  } catch (err) {
    console.error("❌ Ошибка при отправке скрина:", err);
  }
}

// ⏱ Каждые 5 минут
setInterval(sendPriceUpdate, 5 * 60 * 1000);
