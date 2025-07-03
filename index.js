import axios from 'axios';
import { Telegraf } from 'telegraf';
import cron from 'node-cron';

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

async function getGoldPrices() {
  const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=10&apikey=${TWELVE_API_KEY}`;
  const response = await axios.get(url);
  return response.data.values.reverse(); // от старых к новым
}

function buildChartUrl(data) {
  const labels = data.map(item => item.datetime.split(' ')[1]);
  const prices = data.map(item => item.close);

  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gold Price',
        data: prices,
        fill: false,
        borderColor: 'gold',
        tension: 0.1
      }]
    }
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}`;
}

async function sendChart() {
  try {
    const data = await getGoldPrices();
    const chartUrl = buildChartUrl(data);
    await bot.telegram.sendPhoto(CHANNEL_ID, chartUrl, {
      caption: `Live gold price chart 🟡 (5m timeframe)`
    });
  } catch (error) {
    console.error('Error sending chart:', error.message);
  }
}

// Запуск каждые 5 минут
cron.schedule('*/5 * * * *', () => {
  sendChart();
});

// Запуск бота
bot.launch();
console.log('Bot started and sending gold charts every 5 minutes');
