import { UserError } from './admin';
import { BUCKETS } from './storage';
import type { SessionClient } from './supabase';

// Host tour JEGA được phép (khớp check constraint trong DB). Thêm host khi gặp link thật khác.
export const JEGA_HOSTS = ['www.jegaai.com', '720.3vjia.com'];

export function validJegaUrl(raw: string): string | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new UserError('Link tour JEGA không hợp lệ.');
  }
  if (u.protocol !== 'https:' || !JEGA_HOSTS.includes(u.hostname)) {
    throw new UserError(`Link tour phải là HTTPS thuộc ${JEGA_HOSTS.join(' hoặc ')}.`);
  }
  return u.toString();
}

const MAX_POSTER = 8 * 1024 * 1024;

/** Lấy og:image của trang tour, lưu vào Supabase Storage dưới `prefix`. Trả về tên file + kích thước, hoặc null nếu không lấy được. */
export async function fetchTourPoster(sb: SessionClient, tourUrl: string, prefix: string, isPublic: boolean) {
  const html = await (await fetch(tourUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  const og = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
  if (!og || !og.startsWith('https://')) return null;

  const res = await fetch(og);
  const type = (res.headers.get('Content-Type') ?? '').split(';')[0];
  if (!res.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) return null;
  const body = await res.arrayBuffer();
  if (body.byteLength > MAX_POSTER) return null;

  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const file = `w1200.${ext}`; // og:image của JEGA được resize sẵn 1200×630
  const { error } = await sb.storage
    .from(isPublic ? BUCKETS.public : BUCKETS.private)
    .upload(`${prefix}/${file}`, body, { contentType: type, upsert: false });
  if (error) throw new Error(`Lưu poster tour: ${error.message}`);
  return { file, bytes: body.byteLength, width: 1200, height: 630 };
}
