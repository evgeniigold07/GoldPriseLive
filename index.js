const axios = require('axios');
const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const express = require('express');

// 🔐 Конфигурация
const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

let lastPrice = null;

async function getGoldPrice() {
  try {
    const response = await axios.get(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_API_KEY}`);
    return parseFloat(response.data.price);
  } catch (error) {
    console.error("Error fetching gold price:", error.message);
    return null;
  }
}

// ⏰ Проверка на выходной и ночное время
function isMarketClosed() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getUTCHours();

  // Рынок закрыт с пятницы 21:00 UTC до воскресенья 22:00 UTC
  if (day === 5 && hour >= 21) return true;        // Пятница вечер
  if (day === 6) return true;                      // Суббота
  if (day === 0 && hour < 22) return true;         // Воскресенье до 22:00
  if (hour < 0 || hour >= 23) return true;         // Ночная пауза

  return false;
}

// 🕔 Запускаем задачу каждые 5 минут
cron.schedule('*/5 * * * *', async () => {
  if (isMarketClosed()) return;

  const price = await getGoldPrice();
  if (price) {
    const emoji = !lastPrice || price >= lastPrice ? '🟢' : '🔴';
    lastPrice = price;

    const hashtags = '#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets';
    const message = `${emoji} XAU/USD: $${price}\n\n${hashtags}`;

    try {
      await bot.telegram.sendMessage(CHANNEL_ID, message);
      console.log(`[✓] Posted price: $${price}`);
    } catch (err) {
      console.error("Telegram error:", err.message);
    }
  }
});

// 🎭 Обманка для Render — веб-сервер
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 🚀 Запуск
bot.launch();
console.log("Telegram bot started...");
