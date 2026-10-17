// Dùng chung server + trình duyệt admin. Media lưu ở Supabase Storage (CONF-14, cập nhật 15/10/2026).
import type { Media } from './types';

export const BUCKETS = { private: 'media-private', public: 'media-public' } as const;

export const bucketOf = (m: Pick<Media, 'is_public'>) => (m.is_public ? BUCKETS.public : BUCKETS.private);

export const filePaths = (m: Pick<Media, 'prefix' | 'files'>) => m.files.map((f) => `${m.prefix}/${f}`);

/** Gốc URL công khai của bucket public. */
export const publicBase = (supabaseUrl: string) => `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKETS.public}`;

/** ID video từ link YouTube (watch?v=, youtu.be/, shorts/, embed/). null nếu không phải link YouTube hợp lệ. */
export function youtubeId(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}
