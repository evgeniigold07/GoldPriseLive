// Gold Price Bot with Screenshot Posting const TelegramBot = require("node-telegram-bot-api"); const puppeteer = require("puppeteer"); const fetch = require("node-fetch");

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ"; const CHANNEL_ID = "@goldpriselive"; const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

function isMarketOpen() { const now = new Date(); const day = now.getUTCDay(); // 0 (Sun) - 6 (Sat) const hour = now.getUTCHours();

if (day === 6 || (day === 0 && hour < 22) || (day === 5 && hour >= 21)) return false; if (hour < 22 && hour >= 1) return false; // roughly Asian pre-market pause return true; }

async function getGoldPrice() { try { const response = await fetch( https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_API_KEY} ); const data = await response.json(); return parseFloat(data.price); } catch (error) { console.error("Error fetching gold price:", error); return null; } }

async function getScreenshot() { const browser = await puppeteer.launch({ headless: true }); const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 }); await page.goto("https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD", { waitUntil: "networkidle2", }); await page.waitForTimeout(7000); // wait for chart to fully load const buffer = await page.screenshot(); await browser.close(); return buffer; }

async function postGoldPrice() { if (!isMarketOpen()) return;

const price = await getGoldPrice(); if (!price) return;

const emoji = price > 3330 ? "🟢" : "🔴"; const message = ${emoji} XAU/USD: $${price}\n\n#XAUUSD #gold #forex #trading #goldprice #chart #financialmarkets;

const screenshot = await getScreenshot(); await bot.sendPhoto(CHANNEL_ID, screenshot, { caption: message }); }

setInterval(postGoldPrice, 5 * 60 * 1000);

