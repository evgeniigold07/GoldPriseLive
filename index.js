import fetch from 'node-fetch'; import TelegramBot from 'node-telegram-bot-api'; import cron from 'node-cron';

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ"; const CHANNEL_ID = "@goldpriselive"; const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN); let lastPrice = null;

async function getGoldPrice() { try { const response = await fetch( https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_API_KEY} ); const data = await response.json(); return parseFloat(data.price); } catch (error) { console.error('Error fetching gold price:', error); return null; } }

function isMarketOpen(date) { const day = date.getUTCDay(); const hour = date.getUTCHours();

// Market is closed on Saturday (6) and before 22:00 UTC Sunday (0) if (day === 6 || (day === 0 && hour < 22)) return false; // Market closes Friday 21:00 UTC if (day === 5 && hour >= 21) return false; return true; }

cron.schedule('*/5 * * * *', async () => { const now = new Date(); if (!isMarketOpen(now)) return;

const price = await getGoldPrice(); if (price) { const emoji = price >= lastPrice ? '🟢' : '🔴'; lastPrice = price;

const hashtags = '#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets';
const chartLink = 'https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD&interval=5';
const message = `${emoji} XAU/USD: $${price}\n📈 View chart: ${chartLink}\n${hashtags}`;

await bot.sendMessage(CHANNEL_ID, message);

} });

