/* Capture viewport-sized slices of a page on mobile for visual review. */
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const SHELL = path.join(
  process.env.USERPROFILE,
  ".cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe"
);

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const file = process.argv[2] || "index.html";
const name = file.replace(/\.html$/, "");

(async () => {
  const browser = await puppeteer.launch({ executablePath: SHELL });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await page.goto("file:///" + path.join(root, file).replace(/\\/g, "/"), {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1200));
  const total = await page.evaluate(() => document.body.scrollHeight);
  const step = 844;
  let i = 0;
  for (let y = 0; y < total; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 450));
    await page.screenshot({ path: path.join(outDir, `${name}-m${String(i).padStart(2, "0")}.png`) });
    i++;
  }
  console.log(`captured ${i} slices of ${name} (height ${total})`);
  await browser.close();
})();
