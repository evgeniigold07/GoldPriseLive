const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');
const express = require('express');

console.log("🟢 Bot is starting...");

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// 🔧 Проверка, открыт ли рынок
function isMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 - Sunday, 5 - Friday, 6 - Saturday
  const hour = now.getUTCHours();

  if (hour === 23) return false;
  if (day === 6) return false;
  if (day === 0 && hour < 23) return false;
  if (day === 5 && hour >= 23) return false;

  return true;
}

// 🟡 Задача: каждые 5 минут отправлять цену
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log("⏰ Running cron job...");

    if (!isMarketOpen()) {
      console.log("⏸ Market is closed. Skipping price update.");
      return;
    }

    const response = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=XAUTUSDT');
    const price = parseFloat(response.data.result.list[0].lastPrice).toFixed(2);

    const caption = `🟡 XAU/USD: $${price}\n\n#XAUUSD #gold #forex #trading #goldprice #financialmarkets`;

    await bot.telegram.sendMessage(CHANNEL_ID, caption);
    console.log(`[✓] Text price sent: ${caption}`);
  } catch (error) {
    console.error('[❌ Cron error]:', error.message);
  }
});

// ▶️ Запуск бота и одно сообщение при старте
bot.launch().then(() => {
  console.log("✅ Bot launched and waiting for next event.");

  (async () => {
    const now = new Date();
    if (isMarketOpen()) {
      console.log("🚀 Sending initial price after launch...");

      try {
        const response = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=XAUTUSDT');
        const price = parseFloat(response.data.result.list[0].lastPrice).toFixed(2);

        const caption = `🟡 XAU/USD: $${price}\n\n#XAUUSD #gold #forex #trading #goldprice #financialmarkets`;

        await bot.telegram.sendMessage(CHANNEL_ID, caption);
        console.log(`[Initial ✓] Text price sent: ${caption}`);
      } catch (err) {
        console.error("[❌ Initial price error]:", err.message);
      }
    } else {
      console.log("⏸ Market is closed at launch. Initial update skipped.");
    }
  })();

}).catch(err => {
  console.error("❌ Bot failed to launch:", err);
});

// 🌐 Express для Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('GoldPriseLive bot is running ✅'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// 🔁 Пинг каждые 2 минуты, чтобы Render не спал
setInterval(() => {
  axios.get(`https://goldpriselive.onrender.com`).then(() => {
    console.log("🔁 Self-ping to keep Render alive");
  }).catch(() => {
    console.log("⚠️ Ping failed");
  });
}, 120000); // 2 минуты
