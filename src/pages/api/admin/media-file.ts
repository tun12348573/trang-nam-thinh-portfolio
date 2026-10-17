import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { BUCKETS, publicBase } from '../../../lib/storage';

// Admin xem file: chỉ cho file thuộc một media có thật (không nhận đường dẫn tùy ý).
// File public → chuyển tới URL công khai; file private → signed URL 5 phút.
export const GET: APIRoute = async ({ url, locals }) => {
  const id = url.searchParams.get('id') ?? '';
  const file = url.searchParams.get('f') ?? '';
  const { data: m } = await locals.supabase.from('media_assets').select('prefix, files, is_public').eq('id', id).maybeSingle();
  if (!m || !(m.files as string[]).includes(file)) return new Response('Not found', { status: 404 });

  const path = `${m.prefix}/${file}`;
  if (m.is_public) return Response.redirect(`${publicBase(env.SUPABASE_URL)}/${path}`, 302);
  const { data, error } = await locals.supabase.storage.from(BUCKETS.private).createSignedUrl(path, 300);
  if (error || !data) return new Response('Không tạo được link xem file.', { status: 500 });
  return Response.redirect(data.signedUrl, 302);
};
