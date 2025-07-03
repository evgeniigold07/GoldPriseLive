const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

async function generateChart(data) {
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
          backgroundColor: 'yellow',
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: false,
          min: minPrice - 1,
          max: maxPrice + 1,
        },
        x: {
          ticks: {
            maxTicksLimit: 6,
          },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  };

  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}`;

  const lastPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  const trendEmoji = lastPrice > previousPrice ? '🟢' : '🔴';
  const caption = `${trendEmoji} XAU/USD: $${lastPrice.toFixed(2)}`;

  return { chartUrl, caption };
}

cron.schedule('*/5 * * * *', async () => {
  try {
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
    console.error('[Ошибка] Не удалось отправить график:', error.message);
  }
});

bot.launch();
