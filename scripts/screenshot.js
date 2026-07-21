/* Capture desktop + mobile screenshots of local pages for visual review. */
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

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ["index.html"];

(async () => {
  const browser = await puppeteer.launch({ executablePath: SHELL });
  for (const file of pages) {
    const url = "file:///" + path.join(root, file).replace(/\\/g, "/");
    const name = file.replace(/\.html$/, "");
    for (const [label, vp] of [
      ["desktop", { width: 1440, height: 900 }],
      ["mobile", { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 }],
    ]) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1200)); // let preloader finish
      await page.screenshot({ path: path.join(outDir, `${name}-${label}.png`) });
      await page.screenshot({ path: path.join(outDir, `${name}-${label}-full.png`), fullPage: true });
      await page.close();
      console.log(`captured ${name}-${label}`);
    }
  }
  await browser.close();
})();
