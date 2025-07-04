import axios from "axios";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";
import { Telegraf } from "telegraf";

const TELEGRAM_BOT_TOKEN = "7620924463:AAE231OC4JlP5dKsf9qUQ4GNA364iEyeklQ";
const CHANNEL_ID = "@goldpriselive";
const TWELVE_API_KEY = "1b100a43c7504893a0fa01efd0520981";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const width = 800;
const height = 600;
const chartCallback = (ChartJS) => {
  ChartJS.defaults.font.size = 16;
};

const chartCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });

async function getGoldPrices() {
  const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=20&apikey=${TWELVE_API_KEY}`;
  const response = await axios.get(url);
  return response.data.values.reverse();
}

async function generateChart(data) {
  const labels = data.map((entry) => entry.datetime.slice(11, 16));
  const prices = data.map((entry) => parseFloat(entry.close));

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Gold Price",
          data: prices,
          borderColor: "yellow",
          backgroundColor: "yellow",
          pointBackgroundColor: "yellow",
          pointRadius: 3,
          tension: 0.4,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "white",
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "white" },
          grid: {
            color: "rgba(255,255,255,0.1)",
            lineWidth: 1.5,
          },
        },
        y: {
          ticks: { color: "white" },
          grid: {
            color: "rgba(255,255,255,0.1)",
            lineWidth: 1.5,
          },
        },
      },
      responsive: false,
    },
  };

  const buffer = await chartCanvas.renderToBuffer(config);
  fs.writeFileSync("chart.png", buffer);
}

async function main() {
  const data = await getGoldPrices();
  await generateChart(data);

  await bot.telegram.sendPhoto(CHANNEL_ID, { source: "chart.png" }, { caption: "Gold price update 📈" });
}

main();
