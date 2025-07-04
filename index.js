// index.js import axios from 'axios'; import { ChartJSNodeCanvas } from 'chartjs-node-canvas'; import { Telegraf } from 'telegraf'; import fs from 'fs'; import cron from 'node-cron';

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ"; const CHANNEL_ID = "@goldpriselive"; const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const width = 800; const height = 600; const chartCallback = (ChartJS) => { ChartJS.defaults.color = 'white'; }; const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });

async function getGoldPrices() { const url = https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=15&apikey=${TWELVE_API_KEY}; const response = await axios.get(url); return response.data.values.reverse(); }

async function createChart(prices) { const labels = prices.map(p => p.datetime.split(' ')[1].slice(0,5)); const data = prices.map(p => parseFloat(p.close)); const latest = data[data.length - 1]; const previous = data[data.length - 2]; const emoji = latest > previous ? '🟢' : '🔴'; const title = ${emoji} XAU/USD = ${latest};

const configuration = { type: 'line', data: { labels, datasets: [{ label: 'Gold Price', data, borderColor: 'yellow', backgroundColor: 'yellow', tension: 0.2, pointRadius: 3, pointBackgroundColor: 'yellow' }] }, options: { responsive: false, plugins: { legend: { labels: { color: 'white' } }, title: { display: true, text: title, color: 'white', font: { size: 18 } } }, scales: { x: { grid: { color: 'rgba(255, 255, 255, 0.1)', lineWidth: 1 }, ticks: { color: 'white' } }, y: { grid: { color: 'rgba(255, 255, 255, 0.1)', lineWidth: 1 }, ticks: { color: 'white' } } } } };

const image = await chartJSNodeCanvas.renderToBuffer(configuration); fs.writeFileSync('./chart.png', image); return { latest, emoji }; }

async function sendChart() { try { const prices = await getGoldPrices(); const { latest, emoji } = await createChart(prices); await bot.telegram.sendPhoto(CHANNEL_ID, { source: './chart.png' }, { caption: ${emoji} XAU/USD = ${latest} }); } catch (error) { console.error('Error sending chart:', error); } }

cron.schedule('*/5 * * * *', sendChart); bot.launch();

console.log('Bot started...');

