const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');

console.log("🟢 Бот запускается...");

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

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
            borderWidth: 2,
            tension: 0.4,
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
            grid: {
              color: '#555',
              lineWidth: 1.5,
            },
          },
          y: {
            beginAtZero: false,
            min: minPrice - 1,
            max: maxPrice + 1,
            ticks: { color: 'white' },
            grid: {
              color: '#555',
              lineWidth: 1.5,
            },
          },
        },
        plugins: {
          legend: {
            labels: { color: 'white' }
          },
          title: {
            display: true,
            text: 'XAU/USD 5min Chart',
            color: 'white',
            font: { size: 16 },
          },
        },
      },
    };

    const chartUrl = `https://quickchart.io/chart?backgroundColor=black&c=${encodeURIComponent(
      JSON.stringify(chartConfig)
    )}`;

    const lastPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];
    const trendEmoji = lastPrice > previousPrice ? '🟢' : '🔴';
    const caption = `${trendEmoji} XAU/USD: $${lastPrice.toFixed(2)}`;

    return { chartUrl, caption };
  } catch (err) {
    console.error("❌ Ошибка в generateChart:", err);
    throw err;
  }
}

cron.schedule('*/5 * * * *', async () => {
  try {
    console.log("⏰ Сработал cron-задача");

    const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=10&apikey=${TWELVE_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "error") {
      console.error(`[API ERROR] ${data.message}`);
      return;
    }

    if (!data.values || data.values.length < 2) {
      console.error('[Данные] Недостаточно данных для построения графика.');
      return;
    }

    const { chartUrl, caption } = await generateChart(data);

    await bot.telegram.sendPhoto(CHANNEL_ID, chartUrl, {
      caption: caption,
    });

    console.log(`[✓] График отправлен: ${caption}`);
  } catch (error) {
    console.error('[❌ Ошибка cron]:', error.message);
  }
});

bot.launch().then(() => {
  console.log("✅ Бот запущен и ждёт следующего события.");
}).catch(err => {
  console.error("❌ Бот не запустился:", err);
});
