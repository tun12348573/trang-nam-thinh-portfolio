// QA giao diện admin: chụp ảnh 1440/390 px, báo lỗi JS, tràn ngang, vùng bấm < 44px.
// Cần dev server chạy với ADMIN_DESIGN_PREVIEW=1 trong .dev.vars (xem middleware) để vào trang admin không cần đăng nhập.
// Dùng: node scripts/qa-admin.mjs [baseUrl] [path...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4321';
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/admin/login', '/admin/projects', '/admin/projects/new', '/admin/settings'];
mkdirSync('qa', { recursive: true });

const browser = await chromium.launch();
let problems = 0;
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1000 : 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of pages) {
    errors.length = 0;
    const res = await page.goto(base + p, { waitUntil: 'networkidle', timeout: 90000 });
    const r = await page.evaluate(() => {
      const small = [...document.querySelectorAll('a, button, summary, input:not([type=hidden]), select, textarea')]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (!b.width || !b.height || cs.visibility === 'hidden' || el.closest('.sr-only, [aria-hidden=true]')) return false;
          if (el.matches('input.sr-only')) return false;
          if (el.matches('input[type=checkbox]')) return b.height < 24; // công tắc 24px nằm trong nhãn cả dòng ≥ 44px
          return b.height < 44 && b.width < 176;
        })
        .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || el.getAttribute('name') || '').trim().slice(0, 28)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
      return { small, overflow: document.documentElement.scrollWidth - innerWidth };
    });
    const name = `qa/admin${p.replace(/\//g, '_').replace(/^_admin/, '') || '_index'}-${width}.png`;
    await page.screenshot({ path: name, fullPage: true });
    const bad = (res?.status() !== 200) + errors.length + (r.overflow > 0) + (width === 390 ? r.small.length : 0);
    problems += bad;
    console.log(`${bad ? 'FAIL' : 'OK  '} ${width}px ${p} status=${res?.status()} → ${name}`);
    errors.forEach((e) => console.log('   lỗi JS:', e));
    if (r.overflow > 0) console.log('   tràn ngang:', r.overflow, 'px');
    if (width === 390) r.small.forEach((s) => console.log('   vùng bấm nhỏ:', s));
  }
  await page.close();
}
await browser.close();
process.exit(problems ? 1 : 0);
