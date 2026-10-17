// QA-07: bấm poster tour JEGA trên trang chi tiết, chờ iframe tải, chụp ảnh và liệt kê dấu hiệu giỏ hàng/đăng nhập trong frame.
// Dùng: node scripts/qa-jega.mjs <url trang chi tiết>
import { chromium } from '@playwright/test';

const target = process.argv[2] ?? 'http://localhost:4321/cong-trinh/demo-cong-trinh-1';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(target, { waitUntil: 'networkidle' });
const before = await page.locator('iframe').count();
await page.locator('.jega-load').click();
const frameEl = page.locator('.jega iframe');
await frameEl.waitFor();
await frameEl.scrollIntoViewIfNeeded();
await page.waitForTimeout(15000); // tour tải panorama khá nặng
const frame = page.frames().find((f) => f.url().includes('jega') || f.url().includes('3vjia'));
const info = frame
  ? await frame.evaluate(() => ({
      url: location.href,
      title: document.title,
      canvases: document.querySelectorAll('canvas').length,
      text: document.body.innerText.slice(0, 600),
      cartLike: [...document.querySelectorAll('*')]
        .filter((e) => /cart|shop|gouwu|购物/i.test((e.className?.toString?.() ?? '') + ' ' + (e.id ?? '')))
        .slice(0, 10)
        .map((e) => `${e.tagName}.${e.className}`),
    }))
  : null;
await frameEl.screenshot({ path: 'qa/jega-iframe.png' });
console.log(JSON.stringify({ iframesBeforeClick: before, frame: info }, null, 2));
await browser.close();
