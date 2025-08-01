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

// Chart generation
async function generateChart(data) {
  try {
    const reversed = data.values.reverse();
    const prices = reversed.map(item => parseFloat(item.close));
    const timestamps = reversed.map(item => item.datetime);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const chartConfig = {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'Gold Price',
            data: prices,
            borderColor: 'yellow',
            backgroundColor: 'transparent',
            fill: false,
            pointRadius: 3,
            pointBackgroundColor: '#333',
            tension: 0.3,
          },
        ],
      },
      options: {
        layout: {
          padding: 10,
        },
        scales: {
          x: {
            ticks: { color: 'white' },
            grid: { color: '#444' },
          },
          y: {
            beginAtZero: false,
            min: minPrice - 1,
            max: maxPrice + 1,
            ticks: { color: 'white' },
            grid: { color: '#444' },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'XAU/USD 5min Chart',
            color: 'white',
          },
        },
      }
    };

    const chartUrl = `https://quickchart.io/chart?backgroundColor=black&c=${encodeURIComponent(
      JSON.stringify(chartConfig)
    )}`;

    const lastPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];
    const trendEmoji = lastPrice > previousPrice ? '🟢' : '🔴';

    const hashtags = "#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets";
    const caption = `${trendEmoji} XAU/USD: $${lastPrice.toFixed(2)}\n\n${hashtags}`;

    return { chartUrl, caption };

  } catch (err) {
    console.error("❌ Error in generateChart:", err);
    throw err;
  }
}

// ⏰ Cron задача
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log("⏰ Running cron job...");

    if (!isMarketOpen()) {
      console.log("⏸ Market is closed. Skipping chart update.");
      return;
    }

    const response = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=XAUTUSDT');
    const price = parseFloat(response.data.result.list[0].lastPrice);

    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60000);

    const data = {
      values: [
        { datetime: fiveMinAgo.toISOString(), close: (price - 0.5).toFixed(2) },
        { datetime: now.toISOString(), close: price.toFixed(2) }
      ]
    };

    const { chartUrl, caption } = await generateChart(data);

    await bot.telegram.sendPhoto(CHANNEL_ID, chartUrl, {
      caption: caption,
    });

    console.log(`[✓] Chart sent: ${caption}`);
  } catch (error) {
    console.error('[❌ Cron error]:', error.message);
  }
});

// ▶️ Первый запуск
bot.launch().then(() => {
  console.log("✅ Bot launched and waiting for next event.");

  (async () => {
    const now = new Date();
    if (isMarketOpen()) {
      console.log("🚀 Sending initial chart after launch...");

      try {
        const response = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=XAUTUSDT');
        const price = parseFloat(response.data.result.list[0].lastPrice);

        const fiveMinAgo = new Date(now.getTime() - 5 * 60000);
        const data = {
          values: [
            { datetime: fiveMinAgo.toISOString(), close: (price - 0.5).toFixed(2) },
            { datetime: now.toISOString(), close: price.toFixed(2) }
          ]
        };

        const { chartUrl, caption } = await generateChart(data);

        await bot.telegram.sendPhoto(CHANNEL_ID, chartUrl, {
          caption: caption,
        });

        console.log(`[Initial ✓] Chart sent: ${caption}`);
      } catch (err) {
        console.error("[❌ Initial chart error]:", err.message);
      }
    } else {
      console.log("⏸ Market is closed at launch. Initial chart skipped.");
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

// 🔁 Пинг Render каждые 2 минуты
setInterval(() => {
  axios.get('https://goldpriselive.onrender.com').then(() => {
    console.log("🔁 Self-ping to keep Render alive");
  }).catch(() => {
    console.log("⚠️ Ping failed");
  });
}, 120000);
