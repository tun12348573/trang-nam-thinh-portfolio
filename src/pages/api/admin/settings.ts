import type { APIRoute } from 'astro';
import { back, check, failure, str, UserError } from '../../../lib/admin';

const TEXT = ['hero_title', 'hero_text', 'about', 'legal_name', 'address'];
const PLAIN = ['tax_code', 'phone', 'zalo', 'email'];

export const POST: APIRoute = async ({ request, locals }) => {
  const fd = await request.formData();
  try {
    const patch: Record<string, unknown> = { jega_embed_enabled: fd.get('jega_embed_enabled') === 'on' };
    for (const f of TEXT) patch[`${f}_vi`] = str(fd, `${f}_vi`);
    for (const f of PLAIN) patch[f] = str(fd, f);
    if (patch.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(patch.email))) throw new UserError('Email không hợp lệ.');
    if (!patch.legal_name_vi) throw new UserError('Cần nhập tên pháp lý.');
    check(await locals.supabase.from('site_settings').update(patch).eq('id', 1));
    return back('/admin/settings', 'ok', 'Đã lưu. Trang công khai cập nhật trong tối đa 60 giây.');
  } catch (e) {
    return failure(e, '/admin/settings');
  }
};
