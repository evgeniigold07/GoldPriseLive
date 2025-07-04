import axios from 'axios';
import { Telegraf } from 'telegraf';
import cron from 'node-cron';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

async function getGoldPrices() {
  const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=15&apikey=${TWELVE_API_KEY}`;
  const response = await axios.get(url);
  return response.data.values.reverse();
}

async function generateChart(data) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'black' });

  const labels = data.map(d => d.datetime.slice(11, 16));
  const prices = data.map(d => parseFloat(d.close));

  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Gold Price',
        data: prices,
        borderColor: 'yellow',
        backgroundColor: 'yellow',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.2,
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          labels: { color: 'white', font: { size: 14 } }
        },
        title: {
          display: true,
          text: `XAU/USD — ${prices[prices.length - 1]}`,
          color: 'white',
          font: { size: 18 }
        }
      },
      scales: {
        x: {
          ticks: { color: 'white' },
          grid: { color: 'rgba(255,255,255,0.1)', lineWidth: 1 }
        },
        y: {
          ticks: { color: 'white' },
          grid: { color: 'rgba(255,255,255,0.1)', lineWidth: 1 }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(config);
}

async function sendGoldPriceChart() {
  try {
    const data = await getGoldPrices();
    const imageBuffer = await generateChart(data);

    const last = parseFloat(data[data.length - 1].close);
    const prev = parseFloat(data[data.length - 2].close);
    const trendEmoji = last > prev ? '🟢' : '🔴';

    const caption = `${trendEmoji} XAU/USD: ${last}`;

    const tempFilePath = './gold_chart.png';
    fs.writeFileSync(tempFilePath, imageBuffer);

    await bot.telegram.sendPhoto(CHANNEL_ID, { source: tempFilePath }, { caption });
    fs.unlinkSync(tempFilePath);
  } catch (error) {
    console.error('Ошибка при отправке графика:', error);
  }
}

// Запускаем задачу каждые 5 минут
cron.schedule('*/5 * * * *', sendGoldPriceChart);

// Запуск бота
bot.launch();
console.log('✅ Бот запущен и работает каждые 5 минут.');
