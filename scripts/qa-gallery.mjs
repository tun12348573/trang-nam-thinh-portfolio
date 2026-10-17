// QA-03: gallery + lightbox + bản vẽ zoom trên trang chi tiết (dùng dữ liệu demo hoặc công trình thật có ảnh).
// Dùng: node scripts/qa-gallery.mjs [url trang chi tiết]
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const target = process.argv[2] ?? 'http://localhost:4321/cong-trinh/demo-cong-trinh-1';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(target, { waitUntil: 'networkidle' });
const log = (k, v) => console.log(`OK  ${k}${v === undefined ? '' : ': ' + JSON.stringify(v)}`);

// Ảnh trong trang đã tải được (không vỡ link), có alt.
const broken = await page.$$eval('main img:not(.lb-img)', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
assert.deepEqual(broken, [], 'ảnh lỗi');
const noAlt = await page.$$eval('main img:not(.lb-img)', (imgs) => imgs.filter((i) => !i.alt).length);
assert.equal(noAlt, 0, 'ảnh thiếu alt');
log('ảnh tải được, đủ alt', await page.$$eval('main img:not(.lb-img)', (i) => i.length));

// Mở ảnh phối cảnh đầu tiên.
const first = page.locator('#renders ~ .gallery .lb-open, section:has(#renders) .lb-open').first();
await first.click();
const dlg = page.locator('#lightbox');
assert.ok(await dlg.evaluate((d) => d.open), 'lightbox không mở');
await page.waitForFunction(() => document.querySelector('.lb-img').naturalWidth > 0);
const src1 = await page.locator('.lb-img').getAttribute('src');
log('lightbox mở, ảnh full tải xong', src1);
await page.screenshot({ path: 'qa/lightbox-1440.png' });

await page.keyboard.press('ArrowRight');
const src2 = await page.locator('.lb-img').getAttribute('src');
assert.notEqual(src1, src2, 'ArrowRight không chuyển ảnh');
log('ArrowRight chuyển ảnh', src2);
assert.ok(await page.locator('.lb-zoom').isHidden(), 'ảnh phối cảnh không nên có nút zoom');

await page.keyboard.press('Escape');
assert.ok(!(await dlg.evaluate((d) => d.open)), 'Escape không đóng');
const focusBack = await page.evaluate(() => document.activeElement?.classList.contains('lb-open'));
assert.ok(focusBack, 'focus không trả về nút đã mở');
log('Escape đóng, focus trả về nút mở');

// Bản vẽ: khung contain, có nút zoom 100%.
const drawing = page.locator('section:has(#drawings) .lb-open').first();
const fit = await drawing.locator('img').evaluate((i) => getComputedStyle(i).objectFit);
assert.equal(fit, 'contain', 'thumbnail bản vẽ phải contain');
await drawing.click();
await page.waitForFunction(() => document.querySelector('.lb-img').naturalWidth > 0);
const full = await page.locator('.lb-img').evaluate((i) => ({ src: i.getAttribute('src'), nw: i.naturalWidth }));
assert.ok(full.src.endsWith('original.png'), 'bản vẽ phải mở file gốc');
await page.locator('.lb-zoom').click();
const zoomed = await page.locator('.lb-stage').evaluate((s) => s.scrollWidth > s.clientWidth);
assert.ok(zoomed, 'zoom 100% phải cho cuộn');
log('bản vẽ: contain, mở file gốc, zoom 100% cuộn được', full);
await page.screenshot({ path: 'qa/lightbox-drawing-zoom-1440.png' });
await page.locator('.lb-close').click();

// Mobile: lightbox vừa màn hình, không tràn ngang trang.
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, 'tràn ngang 390');
await page.locator('section:has(#renders) .lb-open').first().click();
await page.waitForFunction(() => document.querySelector('.lb-img').naturalWidth > 0);
await page.screenshot({ path: 'qa/lightbox-390.png' });
log('mobile 390: không tràn ngang, lightbox mở');

await browser.close();
