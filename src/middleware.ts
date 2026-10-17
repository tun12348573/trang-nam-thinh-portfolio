import { defineMiddleware } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { env } from 'cloudflare:workers';
import { hasSupabase, sessionClient } from './lib/supabase';
import { legacyEnRedirect } from './lib/text';

/** Gắn header lên response. Response.redirect()/Astro.redirect có header bất biến → tạo bản sao rồi mới sửa. */
function withHeaders(res: Response, headers: Record<string, string>) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
  return out;
}

const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin/');
const PUBLIC_ADMIN = new Set(['/admin/login', '/api/admin/login']);

// Header bảo mật cho mọi response. Không đặt CSP script-src đầy đủ (trang dùng script nội tuyến của Astro,
// Google Fonts, Supabase, iframe JEGA/YouTube) — chỉ các chỉ thị an toàn không làm vỡ trang.
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};
const PUBLIC_HEADERS = { ...SECURITY, 'X-Frame-Options': 'SAMEORIGIN', 'Content-Security-Policy': "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" };
// Admin: cấm nhúng vào iframe (chống clickjacking), form chỉ gửi về chính website, không cache, không index.
const ADMIN_HEADERS = {
  ...SECURITY,
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex',
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  const https: Record<string, string> = ctx.url.protocol === 'https:' ? { 'Strict-Transport-Security': 'max-age=31536000' } : {};

  if (!isAdminPath(ctx.url.pathname)) {
    // Bỏ bản tiếng Anh (17/10/2026): link /en cũ (Google, người đã lưu) chuyển hẳn sang trang tiếng Việt tương ứng.
    const to = legacyEnRedirect(ctx.url.pathname);
    if (to) return withHeaders(Response.redirect(new URL(to + ctx.url.search, ctx.url), 301), { ...PUBLIC_HEADERS, ...https });
    const res = await next();
    // CONF-22: trang công khai cache edge 60 giây (worker.ts lưu vào Cache API).
    const cache: Record<string, string> = ctx.request.method === 'GET' && res.status === 200 && !res.headers.has('Cache-Control') ? { 'Cache-Control': 'public, max-age=0, s-maxage=60' } : {};
    return withHeaders(res, { ...PUBLIC_HEADERS, ...https, ...cache });
  }
  return withHeaders(await admin(ctx, next), { ...ADMIN_HEADERS, ...https });
});

async function admin(ctx: APIContext, next: MiddlewareNext): Promise<Response> {
  const { pathname } = ctx.url;
  if (!hasSupabase()) {
    return new Response('Admin cần cấu hình Supabase (xem SETUP.md).', { status: 503 });
  }

  const supabase = sessionClient(ctx.request, ctx.cookies);
  ctx.locals.supabase = supabase;

  // Chỉ khi chạy dev + ADMIN_DESIGN_PREVIEW=1 (.dev.vars): xem giao diện admin không cần đăng nhập để chụp ảnh QA.
  // Dữ liệu đọc với quyền khách (RLS), mọi thao tác ghi bị từ chối. Bản build production loại bỏ nhánh này (DEV = false).
  if (import.meta.env.DEV && env.ADMIN_DESIGN_PREVIEW === '1' && !PUBLIC_ADMIN.has(pathname)) {
    ctx.locals.user = { id: 'preview', email: 'xem-giao-dien@dev.local' };
    ctx.locals.designPreview = true;
    return next();
  }

  if (!PUBLIC_ADMIN.has(pathname)) {
    // getUser() xác thực token với Supabase Auth; admin_users chỉ cho user đọc dòng của chính mình (RLS).
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    const { data: adminRow } = user
      ? await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
      : { data: null };

    if (!user || !adminRow) {
      if (pathname.startsWith('/api/')) return Response.json({ error: 'unauthorized' }, { status: 401 });
      if (user) {
        // Đăng nhập đúng nhưng chưa được cấp quyền: đăng xuất và báo rõ cách sửa.
        await supabase.auth.signOut();
        const msg = 'Tài khoản chưa có quyền admin: thêm User UID vào bảng admin_users (SETUP.md mục 1.4).';
        return ctx.redirect(`/admin/login?err=${encodeURIComponent(msg)}`);
      }
      return ctx.redirect('/admin/login');
    }
    ctx.locals.user = { id: user.id, email: user.email ?? '' };
  }
  return next();
}
