// Opens the owner's Klipy GIF page in a real browser, lists the media files it loads,
// and saves the best animated one as assets/discord-banner-anim.<ext>.
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(process.env.NODE_PATH + "/");
const { chromium } = require("playwright");

const browser = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  viewport: { width: 1280, height: 900 }, locale: "en-US",
});
const page = await ctx.newPage();
const media = new Map();
page.on("response", async r => {
  const ct = r.headers()["content-type"] || "";
  if (/image\/(gif|webp)|video\/(mp4|webm)/.test(ct)) media.set(r.url(), ct);
});
for (const url of ["https://klipy.com/gifs/rust-ron", "https://klipy.com/gifs/rust-ron/player"]) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    for (let i = 0; i < 6 && /just a moment/i.test(await page.title()); i++) await page.waitForTimeout(5000);
    await page.waitForTimeout(4000);
    console.log(url, "title:", await page.title());
    const srcs = await page.evaluate(() => [...document.querySelectorAll("img, video, source, meta[property^='og:']")]
      .map(e => e.currentSrc || e.src || e.content).filter(Boolean));
    srcs.filter(s => /\.(gif|webp|mp4|webm)(\?|$)/i.test(s)).forEach(s => { if (!media.has(s)) media.set(s, "dom"); });
  } catch (e) { console.log(url, "error:", e.message); }
}
console.log("media found:"); for (const [u, t] of media) console.log(" ", t, u);

// Download each candidate and keep the best: animated WebP, then GIF, then MP4; biggest under 4 MB.
const rank = u => /\.webp/i.test(u) ? 0 : /\.gif/i.test(u) ? 1 : /\.mp4/i.test(u) ? 2 : 3;
const got = [];
for (const u of media.keys()) {
  try {
    const res = await ctx.request.get(u, { headers: { Referer: "https://klipy.com/" } });
    const body = await res.body();
    const ok = res.ok() && body.length > 20000 && body.length < 4 * 1024 * 1024;
    console.log(res.status(), body.length, ok ? "candidate" : "skip", u);
    if (ok) got.push({ u, body, rank: rank(u) });
  } catch (e) { console.log("download error", u, e.message); }
}
got.sort((a, b) => a.rank - b.rank || b.body.length - a.body.length);
if (got.length) {
  const best = got[0];
  const ext = (best.u.match(/\.(webp|gif|mp4|webm)/i) || [, "gif"])[1].toLowerCase();
  fs.writeFileSync(`assets/discord-banner-anim.${ext}`, best.body);
  console.log("saved", `assets/discord-banner-anim.${ext}`, best.body.length, "bytes from", best.u);
}
await browser.close();
