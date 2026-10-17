import type { APIRoute } from 'astro';
import {
  back, check, deleteMediaServer, failure, loadProject, missingForPublish, num, publishProject, slugify, str, UserError,
} from '../../../../lib/admin';
import { fetchTourPoster, validJegaUrl } from '../../../../lib/jega';
import { youtubeId } from '../../../../lib/storage';
import { CATEGORIES, type Category } from '../../../../lib/types';
import type { SessionClient } from '../../../../lib/supabase';

const TEXT_FIELDS = ['title', 'summary', 'concept', 'location', 'style', 'role'];

/** Mỗi dòng một link YouTube → lưu dạng chuẩn https://www.youtube.com/watch?v=ID. */
function parseVideos(raw: string): string[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 12) throw new UserError('Tối đa 12 video.');
  return lines.map((l) => {
    const id = youtubeId(l);
    if (!id) throw new UserError(`Không phải link YouTube hợp lệ: ${l}`);
    return `https://www.youtube.com/watch?v=${id}`;
  });
}

async function save(sb: SessionClient, id: string, fd: FormData) {
  const before = await loadProject(sb, id);
  const slug = slugify(str(fd, 'slug'));
  if (!slug) throw new UserError('Slug không hợp lệ.');
  const category = str(fd, 'category') as Category;
  if (!CATEGORIES.includes(category)) throw new UserError('Danh mục không hợp lệ.');
  const year = num(fd, 'year');
  const jega_url = validJegaUrl(str(fd, 'jega_url'));

  const patch: Record<string, unknown> = {
    slug,
    category,
    position: num(fd, 'position') ?? 100,
    featured: fd.get('featured') === 'on',
    area_m2: num(fd, 'area_m2'),
    year: year === null ? null : Math.trunc(year),
    jega_url,
    video_urls: parseVideos(str(fd, 'video_urls')),
    cover_media_id: str(fd, 'cover_media_id') || null,
  };
  for (const f of TEXT_FIELDS) patch[`${f}_vi`] = str(fd, `${f}_vi`);

  const res = await sb.from('projects').update(patch).eq('id', id);
  if (res.error?.code === '23505') throw new UserError(`Slug "${slug}" đã tồn tại.`);
  if (res.error?.message.includes('publish_requires_content')) {
    throw new UserError('Công trình đang công khai phải có tên, mô tả và ý tưởng. Gỡ xuất bản nếu muốn để trống.');
  }
  check(res);

  // Tour JEGA đổi/xóa → thay poster (lấy og:image của trang tour).
  if (jega_url !== before.jega_url) {
    for (const m of before.media?.filter((m) => m.kind === 'tour_poster') ?? []) await deleteMediaServer(sb, m);
    if (jega_url) {
      const mediaId = crypto.randomUUID();
      const prefix = `p/${id}/${mediaId}`;
      const isPublic = before.status === 'published';
      const poster = await fetchTourPoster(sb, jega_url, prefix, isPublic);
      if (!poster) return 'Đã lưu. Không lấy được ảnh xem trước của tour — có thể tải poster thủ công.';
      check(
        await sb.from('media_assets').insert({
          id: mediaId, project_id: id, kind: 'tour_poster', position: 10, prefix, files: [poster.file],
          width: poster.width, height: poster.height, bytes: poster.bytes, is_public: isPublic,
        }),
      );
    }
  }
  return 'Đã lưu.';
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

export const POST: APIRoute = async ({ request, locals, params }) => {
  const id = params.id!;
  const url = `/admin/projects/${id}`;
  const fd = await request.formData();
  const sb = locals.supabase;
  const action = str(fd, 'action');

  // Các bước xuất bản/gỡ/xóa do script trên trang gọi (fetch) → trả JSON.
  if (action !== 'save') {
    try {
      switch (action) {
        case 'prepare_publish': {
          // Lưu form rồi kiểm tra; nếu đủ nội dung, trình duyệt sẽ chuyển ảnh sang bucket public.
          await save(sb, id, fd);
          const missing = missingForPublish(await loadProject(sb, id));
          if (missing.length) return json({ error: `Chưa thể xuất bản, còn thiếu: ${missing.join(', ')}.` }, 400);
          return json({ ok: true });
        }
        case 'publish':
          await publishProject(sb, id);
          return json({ ok: true, message: 'Đã xuất bản. Trang công khai cập nhật trong tối đa 60 giây.' });
        case 'unpublish':
          // Đổi trạng thái trước để trang biến mất ngay; trình duyệt sau đó thu ảnh về bucket private.
          check(await sb.from('projects').update({ status: 'draft' }).eq('id', id));
          return json({ ok: true });
        case 'delete': {
          // Trình duyệt đã xóa file + bản ghi media; ở đây xóa công trình (media còn sót bị xóa theo cascade).
          check(await sb.from('projects').delete().eq('id', id));
          return json({ ok: true });
        }
        default:
          throw new UserError('Thao tác không hợp lệ.');
      }
    } catch (e) {
      if (!(e instanceof UserError)) console.error(e);
      return json({ error: e instanceof Error ? e.message : String(e) }, e instanceof UserError ? 400 : 500);
    }
  }

  try {
    return back(url, 'ok', await save(sb, id, fd));
  } catch (e) {
    return failure(e, url);
  }
};
