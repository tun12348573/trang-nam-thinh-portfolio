import type { APIRoute } from 'astro';
import { back, check, failure, num, str, UserError } from '../../../../lib/admin';
import type { Media } from '../../../../lib/types';

// Thao tác trên một media: sửa alt/caption/điểm cắt, đổi thứ tự, chọn làm ảnh bìa. (Xóa file do trình duyệt admin làm — xem admin-storage.ts.)
export const POST: APIRoute = async ({ request, locals, params }) => {
  const fd = await request.formData();
  const sb = locals.supabase;
  const returnTo = str(fd, 'return').startsWith('/admin/') ? str(fd, 'return') : '/admin/projects';
  try {
    const m = check(await sb.from('media_assets').select('*').eq('id', params.id!).maybeSingle()) as Media | null;
    if (!m) throw new UserError('Không tìm thấy media.');

    switch (str(fd, 'action')) {
      case 'meta': {
        const pct = (k: string) => Math.round(Math.min(100, Math.max(0, num(fd, k) ?? 50)));
        check(
          await sb
            .from('media_assets')
            .update({
              alt_vi: str(fd, 'alt_vi'),
              caption_vi: str(fd, 'caption_vi'),
              focal_x: pct('focal_x'),
              focal_y: pct('focal_y'),
            })
            .eq('id', m.id),
        );
        return back(returnTo, 'ok', 'Đã lưu mô tả và điểm cắt.');
      }
      case 'up':
      case 'down':
        check(await sb.rpc('move_media', { media_id: m.id, direction: str(fd, 'action') === 'up' ? -1 : 1 }));
        return back(returnTo, 'ok', 'Đã đổi thứ tự.');
      case 'cover':
        if (!m.project_id || !['render', 'photo'].includes(m.kind)) throw new UserError('Chỉ ảnh phối cảnh/ảnh thực tế được làm ảnh bìa.');
        check(await sb.from('projects').update({ cover_media_id: m.id }).eq('id', m.project_id));
        return back(returnTo, 'ok', 'Đã đặt ảnh bìa.');
      default:
        throw new UserError('Thao tác không hợp lệ.');
    }
  } catch (e) {
    return failure(e, returnTo);
  }
};
