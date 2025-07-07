const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const url = process.argv[2];
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 720 });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  await page.waitForTimeout(5000); // подождать загрузку графика

  const path = "chart.png";
  await page.screenshot({ path });
  await browser.close();

  console.log(path);
})();
