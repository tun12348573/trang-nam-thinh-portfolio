import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals }) => {
  await locals.supabase.auth.signOut();
  return new Response(null, { status: 303, headers: { Location: '/admin/login' } });
};
