import { PROJECT_SELECT } from './data';
import { bucketOf, filePaths } from './storage';
import type { SessionClient } from './supabase';
import { REQUIRED_FIELDS, type Media, type Project } from './types';

/** Lỗi hiển thị cho admin (thông báo tiếng Việt), khác lỗi hệ thống. */
export class UserError extends Error {}

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

const NUM_LABEL: Record<string, string> = { area_m2: 'Diện tích', year: 'Năm', position: 'Thứ tự', focal_x: 'Điểm cắt ngang', focal_y: 'Điểm cắt dọc' };

export function num(fd: FormData, k: string): number | null {
  const v = str(fd, k).replace(',', '.');
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new UserError(`${NUM_LABEL[k] ?? k} phải là số (bạn nhập "${v}"). Chưa lưu thay đổi nào — sửa ô này rồi lưu lại.`);
  return n;
}

/** Slug ASCII từ tiếng Việt: "Nhà phố Đà Lạt" → "nha-pho-da-lat". */
export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Chuyển hướng về trang admin kèm thông báo ok/err. */
export function back(url: string, key: 'ok' | 'err', msg: string) {
  const u = new URL(url, 'http://x');
  u.searchParams.set(key, msg);
  return new Response(null, { status: 303, headers: { Location: u.pathname + u.search } });
}

export function failure(e: unknown, url: string) {
  if (e instanceof UserError) return back(url, 'err', e.message);
  console.error(e);
  return back(url, 'err', `Lỗi hệ thống: ${e instanceof Error ? e.message : String(e)}`);
}

export function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const FIELD_LABEL: Record<string, string> = { title: 'Tên công trình', summary: 'Mô tả một dòng', concept: 'Ý tưởng thiết kế' };

/** Trường còn thiếu trước khi xuất bản. DB cũng chặn bằng constraint publish_requires_content. */
export function missingForPublish(p: Project): string[] {
  const out: string[] = [];
  for (const f of REQUIRED_FIELDS) {
    if (!p[`${f}_vi`].trim()) out.push(FIELD_LABEL[f]);
  }
  if (!p.media?.some((m) => m.kind === 'render' || m.kind === 'photo')) out.push('Ít nhất một ảnh phối cảnh hoặc ảnh thực tế');
  return out;
}

export async function loadProject(sb: SessionClient, id: string): Promise<Project> {
  const p = check(await sb.from('projects').select(PROJECT_SELECT).eq('id', id).maybeSingle()) as Project | null;
  if (!p) throw new UserError('Không tìm thấy công trình.');
  p.media?.sort((a, b) => a.kind.localeCompare(b.kind) || a.position - b.position);
  return p;
}

/** Xuất bản (bước cuối): trình duyệt admin đã chuyển media sang bucket public; server kiểm tra lại rồi mới đổi trạng thái. */
export async function publishProject(sb: SessionClient, id: string) {
  const p = await loadProject(sb, id);
  const missing = missingForPublish(p);
  if (missing.length) throw new UserError(`Chưa thể xuất bản, còn thiếu: ${missing.join(', ')}.`);
  const notMoved = (p.media ?? []).filter((m) => !m.is_public).length;
  if (notMoved) throw new UserError(`Còn ${notMoved} ảnh chưa chuyển sang bucket công khai. Bấm "Lưu và xuất bản" lại.`);
  check(await sb.from('projects').update({ status: 'published', published_at: p.published_at ?? new Date().toISOString() }).eq('id', id));
}

/** Xóa media ở server (dùng khi đổi tour JEGA: 1–2 file, không vượt giới hạn subrequest). */
export async function deleteMediaServer(sb: SessionClient, m: Media) {
  check(await sb.from('media_assets').delete().eq('id', m.id));
  const { error } = await sb.storage.from(bucketOf(m)).remove(filePaths(m));
  if (error) throw new Error(error.message);
}
