import { env } from 'cloudflare:workers';
import { anonClient, hasSupabase } from './supabase';
import { publicBase } from './storage';
import { demoProjects, demoSettings } from './demo';
import type { Media, Project, SiteSettings } from './types';

// Embed media qua FK tên rõ ràng: projects có 2 quan hệ tới media_assets (project_id và cover_media_id).
export const PROJECT_SELECT = '*, media:media_assets!media_project_fk(*)';

export const isDemo = () => !hasSupabase();

/** Gốc URL ảnh công khai: bucket public của Supabase; chế độ demo dùng file trong public/ (prefix media/demo/...). */
export const mediaBase = () => (isDemo() ? '' : publicBase(env.SUPABASE_URL));

function sortMedia(p: Project): Project {
  p.media?.sort((a, b) => a.position - b.position);
  return p;
}

// Bộ nhớ đệm trong Worker (theo isolate) cho dữ liệu công khai — chống quá tải khi đông khách:
// - Trong 60 giây (CONF-22) dùng lại kết quả, không gọi Supabase. Chạy cả trên workers.dev (Cache API thì không).
// - Nhiều request cùng lúc khi hết hạn chỉ gây MỘT lần gọi Supabase (dùng chung promise).
// - Supabase lỗi/quá tải → trả bản cũ gần nhất thay vì trang lỗi (stale-on-error).
// Dev: không đệm, sửa dữ liệu thấy ngay.
const TTL = import.meta.env.DEV ? 0 : 60_000;
const memo = new Map<string, { at: number; value?: unknown; pending?: Promise<unknown> }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const entry = memo.get(key);
  if (entry && 'value' in entry && Date.now() - entry.at < TTL) return entry.value as T;
  if (entry?.pending) return entry.pending as Promise<T>;
  const pending = load()
    .then((value) => {
      memo.set(key, { at: Date.now(), value });
      return value;
    })
    .catch((error) => {
      if (entry && 'value' in entry) {
        console.error(`Supabase lỗi, dùng dữ liệu cũ (${key}):`, error);
        memo.set(key, { at: entry.at, value: entry.value });
        return entry.value as T;
      }
      memo.delete(key);
      throw error;
    });
  memo.set(key, { ...entry, at: entry?.at ?? 0, pending });
  return pending;
}

export function getSettings(): Promise<SiteSettings> {
  if (isDemo()) return Promise.resolve(demoSettings);
  return cached('settings', async () => {
    const { data, error } = await anonClient()
      .from('site_settings')
      .select('*, hero_media:media_assets!settings_hero_fk(*), logo_media:media_assets!settings_logo_fk(*)')
      .eq('id', 1)
      .single();
    if (error) throw error;
    const s = data as SiteSettings;
    // Ảnh Giới thiệu: tải theo id thay vì embed qua FK settings_about_fk — DB chưa chạy migration 0004 vẫn không lỗi.
    if (s.about_media_id) {
      const { data: m } = await anonClient().from('media_assets').select('*').eq('id', s.about_media_id).maybeSingle();
      s.about_media = (m as Media | null) ?? null;
    }
    return s;
  });
}

/** Công trình đã xuất bản, theo thứ tự. RLS chặn bản nháp kể cả khi quên điều kiện status. */
export function getPublishedProjects(): Promise<Project[]> {
  if (isDemo()) return Promise.resolve(demoProjects);
  return cached('projects', async () => {
    const { data, error } = await anonClient()
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('status', 'published')
      .order('position')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return (data as Project[]).map(sortMedia);
  });
}

/** Một công trình: lấy từ danh sách đã đệm (portfolio ít công trình → rẻ hơn một truy vấn riêng). */
export async function getPublishedProject(slug: string): Promise<Project | null> {
  return (await getPublishedProjects()).find((p) => p.slug === slug) ?? null;
}

/** Dữ liệu trang chi tiết: null → page trả 404. Công trình liên quan ưu tiên cùng danh mục. */
export async function loadProjectPage(slug: string) {
  const [settings, all] = await Promise.all([getSettings(), getPublishedProjects()]);
  const project = all.find((p) => p.slug === slug);
  if (!project) return null;
  const others = all.filter((p) => p.id !== project.id);
  const related = [...others.filter((p) => p.category === project.category), ...others.filter((p) => p.category !== project.category)].slice(0, 3);
  return { settings, project, related };
}

export function coverOf(p: Project): Media | undefined {
  return p.media?.find((m) => m.id === p.cover_media_id) ?? p.media?.find((m) => m.kind === 'render' || m.kind === 'photo');
}
