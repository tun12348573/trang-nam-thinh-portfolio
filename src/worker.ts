import { handle } from '@astrojs/cloudflare/handler';

// Trang công khai được cache ở edge tối đa 60 giây (CONF-22), không purge khi xuất bản.
// Lưu ý: Cache API không hoạt động trên *.workers.dev — chỉ có hiệu lực khi đã gắn custom domain.
const PRIVATE_PREFIXES = ['/admin', '/api'];

function isCacheable(request: Request) {
  if (request.method !== 'GET') return false;
  const { pathname } = new URL(request.url);
  return !PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default {
  async fetch(request, env, ctx) {
    // Dev: không cache, để sửa code / xuất bản thấy ngay (production vẫn cache 60 giây).
    if (import.meta.env.DEV || !isCacheable(request)) return handle(request, env, ctx);

    // Type DOM của Astro che mất `caches.default` của Workers → ép kiểu.
    const cache = (caches as unknown as { default: Cache }).default;
    const hit = await cache.match(request);
    if (hit) return hit;

    const response = await handle(request, env, ctx);
    if (response.status === 200 && (response.headers.get('Cache-Control') ?? '').includes('s-maxage')) {
      ctx.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  },

  // Cron hằng ngày: một truy vấn nhẹ để Supabase Free không tạm dừng project (CONF-24).
  async scheduled(_controller, env, ctx) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return;
    ctx.waitUntil(
      fetch(`${env.SUPABASE_URL}/rest/v1/site_settings?select=id&limit=1`, {
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
      }).then((r) => console.log('supabase keep-alive', r.status)),
    );
  },
} satisfies ExportedHandler<Env>;
