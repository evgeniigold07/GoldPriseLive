const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');
const express = require('express');

console.log("🟢 Bot is starting...");

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

let lastPrice = null;
let lastUpdated = null;

function isMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 - Sunday, 6 - Saturday
  const hour = now.getUTCHours();

  if (day === 6) return false;                  // Saturday
  if (day === 0 && hour < 23) return false;     // Sunday before 23:00 UTC
  if (day === 5 && hour >= 23) return false;    // Friday after 23:00 UTC

  return true;
}

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

    const last = prices[prices.length - 1];
    const prev = prices[prices.length - 2];
    const trendEmoji = last > prev ? '🟢' : '🔴';

    const hashtags = "#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets";
    const caption = `${trendEmoji} XAU/USD: $${last.toFixed(2)}\n\n${hashtags}`;

    return { chartUrl, caption, lastPrice: last };
  } catch (err) {
    console.error("❌ Error in generateChart:", err);
    throw err;
  }
}

cron.schedule('*/5 * * * *', async () => {
  try {
    console.log("⏰ Running cron job...");

    const now = new Date();

    if (!isMarketOpen()) {
      console.log("⏸ Рынок закрыт. Пропуск отправки.");
      return;
    }

    const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=10&apikey=${TWELVE_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "error") {
      console.error(`[API ERROR] ${data.message}`);
      return;
    }

    if (!data.values || data.values.length < 2) {
      console.error('[Data] Not enough values to build chart.');
      return;
    }

    const { chartUrl, caption, lastPrice: currentPrice } = await generateChart(data);

    if (
      lastPrice !== null &&
      currentPrice === lastPrice &&
      lastUpdated !== null &&
      now - lastUpdated < 10 * 60 * 1000
    ) {
      console.log("⏸ Цена не изменилась за 10 минут. Пропуск отправки.");
      return;
    }

    lastPrice = currentPrice;
    lastUpdated = now;

    await bot.telegram.sendPhoto(CHANNEL_ID, chartUrl, {
      caption: caption,
    });

    console.log(`[✓] Chart sent: ${caption}`);
  } catch (error) {
    console.error('[❌ Cron error]:', error.message);
  }
});

bot.launch().then(() => {
  console.log("✅ Bot launched and waiting for next event.");
}).catch(err => {
  console.error("❌ Bot failed to launch:", err);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('GoldPriseLive bot is running ✅'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
