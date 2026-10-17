import type { APIRoute } from 'astro';
import { back, check, failure, slugify, str, UserError } from '../../../../lib/admin';
import { CATEGORIES, type Category } from '../../../../lib/types';

// Tạo công trình mới (luôn ở trạng thái nháp).
export const POST: APIRoute = async ({ request, locals }) => {
  const fd = await request.formData();
  try {
    const title_vi = str(fd, 'title_vi');
    if (!title_vi) throw new UserError('Cần nhập tên công trình (tiếng Việt).');
    const slug = slugify(str(fd, 'slug') || title_vi);
    if (!slug) throw new UserError('Slug không hợp lệ.');
    const category = str(fd, 'category') as Category;
    if (!CATEGORIES.includes(category)) throw new UserError('Danh mục không hợp lệ.');

    const res = await locals.supabase.from('projects').insert({ slug, title_vi, category }).select('id').single();
    if (res.error?.code === '23505') throw new UserError(`Slug "${slug}" đã tồn tại.`);
    const { id } = check(res) as { id: string };
    return back(`/admin/projects/${id}`, 'ok', 'Đã tạo công trình ở trạng thái nháp.');
  } catch (e) {
    return failure(e, '/admin/projects/new');
  }
};
