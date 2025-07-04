const axios = require('axios'); const { Telegraf } = require('telegraf'); const cron = require('node-cron'); const express = require('express'); const app = express(); const PORT = process.env.PORT || 10000;

// 🔐 Константы const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ"; const CHANNEL_ID = "@goldpriselive"; const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

// 🌐 Express сервер для Render app.get('/', (req, res) => res.send('Bot is running')); app.listen(PORT, () => { console.log(Server running on port ${PORT}); });

// 🤖 Создание Telegram-бота const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// 📉 Получение цены золота async function getGoldPrice() { try { const url = https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_API_KEY}; const response = await axios.get(url); const price = parseFloat(response.data.price).toFixed(2); return price; } catch (error) { console.error("Error fetching gold price:", error.message); return null; } }

// 🔄 Последняя цена (для сравнения) let lastPrice = 0;

// ⏰ Проверка времени и дня недели function isMarketOpen() { const now = new Date(); const day = now.getUTCDay(); // Sunday = 0, Saturday = 6 const hour = now.getUTCHours(); // UTC часы

// 🕰️ Торгуется с воскресенья 22:00 UTC до пятницы 22:00 UTC const isWeekend = (day === 6) || (day === 0 && hour < 22) || (day === 5 && hour >= 22); return !isWeekend; }

// 🕔 Рассылка каждые 5 минут, только когда рынок открыт cron.schedule('*/5 * * * *', async () => { if (!isMarketOpen()) return;

const price = await getGoldPrice(); if (price) { const emoji = price >= lastPrice ? '🟢' : '🔴'; lastPrice = price; const hashtags = '#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets'; const message = ${emoji} XAU/USD: $${price}\n\n${hashtags}; await bot.telegram.sendMessage(CHANNEL_ID, message); } });

// ▶️ Запуск бота bot.launch(); console.log("Bot started and running...");

