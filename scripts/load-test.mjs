// Thử tải nhẹ: gửi N request với C request đồng thời vào các trang công khai, báo mã lỗi và độ trễ p50/p95/max.
// Dùng: node scripts/load-test.mjs <baseUrl> [tổng=300] [đồng thời=30]
// Lưu ý: Workers Free giới hạn 100.000 request/ngày — đừng chạy số lớn.
const base = process.argv[2];
const total = Number(process.argv[3] ?? 300);
const concurrency = Number(process.argv[4] ?? 30);
if (!base) throw new Error('Thiếu baseUrl');

const paths = ['/', '/cong-trinh'];
// Thêm trang chi tiết đầu tiên tìm được trong danh sách.
const list = await (await fetch(base + '/cong-trinh')).text();
const slug = list.match(/href="\/cong-trinh\/([a-z0-9-]+)"/)?.[1];
if (slug) paths.push(`/cong-trinh/${slug}`);

const times = [];
const codes = {};
let next = 0;
async function worker() {
  while (next < total) {
    const path = paths[next++ % paths.length];
    const t = performance.now();
    try {
      const res = await fetch(base + path);
      await res.arrayBuffer();
      codes[res.status] = (codes[res.status] ?? 0) + 1;
    } catch (e) {
      codes[`lỗi mạng`] = (codes['lỗi mạng'] ?? 0) + 1;
    }
    times.push(performance.now() - t);
  }
}
const start = performance.now();
await Promise.all(Array.from({ length: concurrency }, worker));
const secs = (performance.now() - start) / 1000;
times.sort((a, b) => a - b);
const pct = (p) => Math.round(times[Math.min(times.length - 1, Math.floor((p / 100) * times.length))]);
console.log(`Trang: ${paths.join(', ')}`);
console.log(`${total} request, ${concurrency} đồng thời, ${secs.toFixed(1)}s → ${(total / secs).toFixed(1)} req/s`);
console.log('Mã trả về:', codes);
console.log(`Độ trễ: p50 ${pct(50)}ms · p95 ${pct(95)}ms · max ${Math.round(times.at(-1))}ms`);
process.exit(Object.keys(codes).every((c) => c === '200') ? 0 : 1);
