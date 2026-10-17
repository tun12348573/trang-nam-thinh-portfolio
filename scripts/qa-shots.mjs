// Chụp ảnh QA ở 390/768/1440 px và kiểm tra tràn ngang.
// Dùng: node scripts/qa-shots.mjs [baseUrl] [path...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4321';
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/cong-trinh'];
const widths = [390, 768, 1440];
mkdirSync('qa', { recursive: true });

const browser = await chromium.launch();
let failed = false;
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w === 1440 ? 1060 : 900 } });
  for (const p of pages) {
    const res = await page.goto(base + p, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = `qa/${(p.replace(/\//g, '_') || '_').replace(/^_$/, 'home')}-${w}.png`;
    await page.screenshot({ path: name, fullPage: true });
    const ok = res?.status() === 200 && overflow <= 0;
    if (!ok) failed = true;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${w}px ${p} status=${res?.status()} overflowX=${overflow}px → ${name}`);
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
