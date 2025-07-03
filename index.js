import axios from 'axios';
import { Telegraf } from 'telegraf';
import cron from 'node-cron';

const bot = new Telegraf('ТВОЙ_БОТ_ТОКЕН'); // 🔁 Замени на токен бота
const chatId = 'ТВОЙ_CHAT_ID_ИЛИ_КАНАЛ';   // 🔁 Замени на @название_канала или chat_id

async function getGoldPrices() {
  const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=10&apikey=ТВОЙ_API_КЛЮЧ`; // 🔁 Вставь ключ TwelveData
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

  const encoded = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encoded}`;
}

async function postChartToTelegram() {
  try {
    const prices = await getGoldPrices();
    const chartUrl = buildChartUrl(prices);
    await bot.telegram.sendPhoto(chatId, chartUrl, {
      caption: `📉 Gold price (5m chart) – updated: ${new Date().toLocaleTimeString()}`
    });
    console.log('Chart posted to Telegram');
  } catch (error) {
    console.error('Error posting chart:', error.message);
  }
}

// ⏰ Авто-запуск каждые 5 минут
cron.schedule('*/5 * * * *', () => {
  postChartToTelegram();
});

bot.launch();
