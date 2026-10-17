import { env } from 'cloudflare:workers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export const hasSupabase = () => Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);

/** Client ẩn danh cho trang công khai: RLS chỉ cho đọc công trình đã xuất bản và media public. */
export function anonClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client theo phiên đăng nhập (cookie). Mọi thao tác ghi đi qua client này → RLS kiểm tra quyền admin. */
export function sessionClient(request: Request, cookies: AstroCookies) {
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' }));
      },
      setAll(list) {
        for (const { name, value, options } of list) cookies.set(name, value, { ...options, path: '/' });
      },
    },
  });
}

export type SessionClient = ReturnType<typeof sessionClient>;
