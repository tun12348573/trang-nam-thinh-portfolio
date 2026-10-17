// CHỈ chạy trong trình duyệt admin. Thao tác file trên Supabase Storage bằng phiên đăng nhập của admin
// (RLS storage.objects chỉ cho admin). Làm ở trình duyệt thay vì Worker vì Workers Free giới hạn 50 subrequest/request,
// trong khi xuất bản một công trình nhiều ảnh cần hàng trăm lệnh move.
import { createBrowserClient } from '@supabase/ssr';
import { BUCKETS, bucketOf, filePaths } from './storage';
import type { Media } from './types';

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Client trình duyệt dùng chung cookie phiên với server. URL/key lấy từ data-* trên <body> (layout Admin). */
export function sb() {
  if (!client) {
    const d = document.body.dataset;
    client = createBrowserClient(d.sbUrl!, d.sbKey!);
  }
  return client;
}

function fail(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

/** Chuyển file của một media sang bucket public/private rồi cập nhật cờ is_public. Chạy lại an toàn nếu lần trước dừng giữa chừng. */
export async function setMediaPublic(m: Media, toPublic: boolean) {
  if (m.is_public === toPublic) return;
  const from = toPublic ? BUCKETS.private : BUCKETS.public;
  const to = toPublic ? BUCKETS.public : BUCKETS.private;
  for (const path of filePaths(m)) {
    const { error } = await sb().storage.from(from).move(path, path, { destinationBucket: to });
    if (error) {
      // Lần chạy trước bị ngắt: file có thể đã nằm ở bucket đích → chỉ bỏ qua khi xác nhận được điều đó.
      const { data: there } = await sb().storage.from(to).exists(path);
      if (!there) fail(error, `Chuyển ${path}`);
    }
  }
  fail((await sb().from('media_assets').update({ is_public: toPublic }).eq('id', m.id)).error, 'Cập nhật media');
  m.is_public = toPublic;
}

/** Xóa bản ghi trước (trang không còn trỏ tới file), rồi xóa file. */
export async function deleteMedia(m: Media) {
  fail((await sb().from('media_assets').delete().eq('id', m.id)).error, 'Xóa bản ghi media');
  fail((await sb().storage.from(bucketOf(m)).remove(filePaths(m))).error, 'Xóa file');
}

export async function projectMedia(projectId: string): Promise<Media[]> {
  const { data, error } = await sb().from('media_assets').select('*').eq('project_id', projectId);
  fail(error, 'Đọc media');
  return data as Media[];
}

/** Upload các file của một media mới; lỗi giữa chừng → dọn file đã lên. */
export async function uploadFiles(bucket: string, prefix: string, files: { name: string; blob: Blob }[], onEach?: (i: number) => void) {
  const done: string[] = [];
  try {
    for (const [i, f] of files.entries()) {
      const path = `${prefix}/${f.name}`;
      const { error } = await sb().storage.from(bucket).upload(path, f.blob, { contentType: f.blob.type, upsert: false });
      fail(error, `Tải ${f.name}`);
      done.push(path);
      onEach?.(i + 1);
    }
  } catch (e) {
    if (done.length) await sb().storage.from(bucket).remove(done);
    throw e;
  }
}
