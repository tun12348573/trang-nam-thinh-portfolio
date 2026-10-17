import type { APIRoute } from 'astro';
import { back, str } from '../../../lib/admin';

// Lỗi thường gặp → thông báo dễ hiểu; lỗi khác hiện nguyên văn để biết đường sửa cấu hình Supabase.
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Sai email hoặc mật khẩu.',
  email_not_confirmed: 'Email chưa được xác nhận. Trên Supabase, tạo user với tùy chọn "Auto Confirm User".',
  email_provider_disabled: 'Supabase đang tắt đăng nhập bằng email: bật lại ở Authentication → Sign In / Providers → Email.',
};

// Chống dò mật khẩu: tối đa 8 lần sai / IP / 15 phút. Supabase Auth cũng giới hạn, nhưng mọi request đến từ IP
// của Cloudflare nên Supabase không phân biệt được từng người. ponytail: đếm trong bộ nhớ isolate (mỗi isolate
// đếm riêng) — đủ chặn dò hàng loạt; cần chặt hơn thì bật Cloudflare Rate Limiting rule cho /api/admin/login.
const WINDOW = 15 * 60_000;
const MAX_FAILS = 8;
const fails = new Map<string, { count: number; since: number }>();

export const POST: APIRoute = async ({ request, locals }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const now = Date.now();
  const f = fails.get(ip);
  if (f && now - f.since > WINDOW) fails.delete(ip);
  if ((fails.get(ip)?.count ?? 0) >= MAX_FAILS) {
    return back('/admin/login', 'err', 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.');
  }

  const fd = await request.formData();
  const { error } = await locals.supabase.auth.signInWithPassword({ email: str(fd, 'email'), password: str(fd, 'password') });
  if (error) {
    if (error.code === 'invalid_credentials') {
      const cur = fails.get(ip) ?? { count: 0, since: now };
      fails.set(ip, { count: cur.count + 1, since: cur.since });
    }
    console.error('login', error.code, error.message);
    return back('/admin/login', 'err', MESSAGES[error.code ?? ''] ?? `Không đăng nhập được: ${error.message}`);
  }
  fails.delete(ip);
  // Chưa có trong admin_users → middleware sẽ trả về trang login.
  return new Response(null, { status: 303, headers: { Location: '/admin/projects' } });
};
