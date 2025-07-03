const express = require("express");
const axios = require("axios");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const port = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHAT_ID = "@goldpriselive";
const API_KEY = "1b100a43c7504893a0fa01efd0520981";

const width = 600;
const height = 400;
const chartCallback = (ChartJS) => {
  ChartJS.defaults.font.size = 16;
};
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });

async function getPriceData() {
  const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1min&apikey=${API_KEY}&outputsize=10`;
  const res = await axios.get(url);
  return res.data.values.reverse();
}

async function generateChart(data) {
  const prices = data.map(p => parseFloat(p.close));
  const times = data.map(p => p.datetime.slice(11, 16));

  const config = {
    type: 'line',
    data: {
      labels: times,
      datasets: [{
        label: 'XAU/USD',
        data: prices,
        borderWidth: 2,
        fill: false
      }]
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(config);
}

async function postToTelegram(imageBuffer, lastPrice) {
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  const caption = `📉 XAU/USD: $${lastPrice}`;
  await bot.sendPhoto(CHAT_ID, imageBuffer, { caption });
}

app.get("/", async (req, res) => {
  try {
    const data = await getPriceData();
    const chart = await generateChart(data);
    await postToTelegram(chart, data[data.length - 1].close);
    res.send("Chart sent to Telegram!");
  } catch (e) {
    console.error(e);
    res.status(500).send("Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
