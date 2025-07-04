// 📦 Импорты import axios from 'axios'; import { Telegraf } from 'telegraf'; import cron from 'node-cron'; import { ChartJSNodeCanvas } from 'chartjs-node-canvas'; import fs from 'fs';

// 🔑 Константы const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ"; const CHANNEL_ID = "@goldpriselive"; const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981"; const WIDTH = 800; const HEIGHT = 600;

const bot = new Telegraf(TELEGRAM_BOT_TOKEN); const chartCanvas = new ChartJSNodeCanvas({ width: WIDTH, height: HEIGHT, backgroundColour: 'black' });

// 📊 Генерация графика async function generateChart(data) { const prices = data.values.map(point => parseFloat(point.close)).reverse(); const times = data.values.map(point => point.datetime).reverse();

const config = { type: 'line', data: { labels: times, datasets: [{ label: 'Gold Price', data: prices, borderColor: 'yellow', backgroundColor: 'yellow', borderWidth: 2, pointBackgroundColor: '#444', pointRadius: 4, pointHoverRadius: 6, tension: 0.3 }] }, options: { plugins: { legend: { labels: { color: 'yellow', font: { size: 14 } } } }, scales: { x: { ticks: { color: '#aaa', maxRotation: 45, minRotation: 45 }, grid: { color: '#333', lineWidth: 1 } }, y: { ticks: { color: '#aaa' }, grid: { color: '#333', lineWidth: 1.2 } } } } };

const imageBuffer = await chartCanvas.renderToBuffer(config); const filename = './chart.png'; fs.writeFileSync(filename, imageBuffer);

const latestPrice = prices[prices.length - 1]; const previousPrice = prices[prices.length - 2]; const isUp = latestPrice > previousPrice; const emoji = isUp ? '🟢' : '🔴';

const caption = ${emoji} XAU/USD: $${latestPrice}; return { path: filename, caption }; }

// 📅 Запуск каждые 5 минут cron.schedule('*/5 * * * *', async () => { try { const url = https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=10&apikey=${TWELVE_API_KEY}; const response = await axios.get(url); const data = response.data;

if (data.status === "error") {
  console.error(`[API ERROR] ${data.message}`);
  return;
}

if (!data.values || data.values.length < 2) {
  console.error('[Данные] Недостаточно данных для графика.');
  return;
}

const { path, caption } = await generateChart(data);
await bot.telegram.sendPhoto(CHANNEL_ID, { source: path }, { caption });
console.log(`[✓] График отправлен: ${caption}`);

} catch (error) { console.error('[Ошибка] Не удалось отправить график:', error.message); } });

// ▶️ Запуск bot.launch(); console.log('🟢 Бот запускается...');

