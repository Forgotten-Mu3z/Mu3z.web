// Opens the live site, scrolls to the Discord card and reports whether the Klipy banner player loads and animates.
import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("shots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const log = [];
page.on("console", m => log.push(`console.${m.type()}: ${m.text()}`));
page.on("pageerror", e => log.push(`pageerror: ${e.message}`));
page.on("requestfailed", r => log.push(`request failed: ${r.url()} ${r.failure()?.errorText}`));
page.on("response", r => { if (r.url().includes("klipy")) log.push(`klipy response: ${r.status()} ${r.url()}`); });
await page.goto("https://forgotten-mu3z.github.io/Mu3z.web/?check=" + Date.now(), { waitUntil: "networkidle" });
await page.evaluate(() => document.getElementById("contact").scrollIntoView());
await page.waitForTimeout(6000);
const info = await page.evaluate(() => {
  const f = document.querySelector(".profile__banner iframe");
  if (!f) return { iframe: false };
  const r = f.getBoundingClientRect();
  return { iframe: true, ready: f.classList.contains("is-ready"), opacity: getComputedStyle(f).opacity, src: f.src, box: [Math.round(r.width), Math.round(r.height)] };
});
console.log("banner iframe:", JSON.stringify(info));
const banner = await page.$(".profile__banner");
const shots = [];
for (let i = 0; i < 4; i++) {
  const buf = await banner.screenshot({ path: `shots/banner-${i}.png` });
  shots.push(buf.toString("base64"));
  await page.waitForTimeout(700);
}
console.log("banner frames differ (animating):", new Set(shots).size > 1, `(${new Set(shots).size} distinct of 4)`);
await (await page.$(".profile")).screenshot({ path: "shots/card.png" });
const frame = page.frames().find(f => f.url().includes("klipy"));
if (frame) {
  const inner = await frame.evaluate(() => ({
    title: document.title,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    media: [...document.querySelectorAll("img, video, source")].map(e => `${e.tagName} ${e.currentSrc || e.src} ${e.clientWidth}x${e.clientHeight}`).slice(0, 10),
    text: document.body.innerText.slice(0, 200),
  })).catch(e => ({ error: e.message }));
  console.log("inside klipy player:", JSON.stringify(inner));
}
console.log(log.join("\n"));
await browser.close();
