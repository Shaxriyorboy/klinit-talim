// Bitta sahifani 1920x1080 rasmga olish: node scripts/snap.mjs <url> <out.png>
import { chromium } from "playwright-core";
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
await p.screenshot({ path: out });
await b.close();
