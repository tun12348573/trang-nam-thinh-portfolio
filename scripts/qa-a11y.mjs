// Rà soát nhanh khả năng truy cập trên trang công khai: vùng bấm < 44px (mobile), chữ < 12px, ảnh thiếu alt, tràn ngang.
// Dùng: node scripts/qa-a11y.mjs [baseUrl] [path...]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/cong-trinh'];
const browser = await chromium.launch();
let problems = 0;
for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const visible = (el) => {
        const b = el.getBoundingClientRect();
        return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      const small = [...document.querySelectorAll('a, button, summary, input, select, textarea')]
        .filter(visible)
        .map((el) => ({ el, b: el.getBoundingClientRect() }))
        .filter(({ b }) => b.height < 44 && b.width < 44 * 4) // link chữ dài (> 176px) coi như đủ rộng để bấm
        .map(({ el, b }) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(b.width)}×${Math.round(b.height)}`);
      const tiny = [...document.querySelectorAll('body *')]
        .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visible(el))
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
        .map((el) => `"${el.textContent.trim().slice(0, 30)}" ${getComputedStyle(el).fontSize}`);
      const noAlt = [...document.querySelectorAll('img:not([alt])')].length;
      return { small, tiny, noAlt, overflow: document.documentElement.scrollWidth - innerWidth };
    });
    const bad = (width === 390 ? r.small.length : 0) + r.tiny.length + r.noAlt + (r.overflow > 0 ? 1 : 0);
    problems += bad;
    console.log(`${bad ? 'FAIL' : 'OK  '} ${width}px ${p}`);
    if (width === 390) r.small.forEach((s) => console.log('   vùng bấm nhỏ:', s));
    r.tiny.forEach((s) => console.log('   chữ < 12px:', s));
    if (r.noAlt) console.log('   ảnh thiếu alt:', r.noAlt);
    if (r.overflow > 0) console.log('   tràn ngang:', r.overflow, 'px');
  }
  await page.close();
}
await browser.close();
process.exit(problems ? 1 : 0);
