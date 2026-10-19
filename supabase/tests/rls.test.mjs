// Kiểm thử migration + RLS bằng PGlite (Postgres WASM, không cần Docker).
// Mô phỏng tối thiểu môi trường Supabase: schema auth, auth.uid() đọc từ request.jwt.claim.sub, role anon/authenticated.
// Chạy: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const ADMIN = '00000000-0000-0000-0000-00000000000a';
const OTHER = '00000000-0000-0000-0000-00000000000b';

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  insert into auth.users values ('${ADMIN}'), ('${OTHER}');
  -- Storage tối giản (Supabase Storage có thêm cột/hàm; chỉ cần đủ cho migration 0002 + RLS).
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`);
const migrate = async (m) => db.exec(readFileSync(new URL(`../migrations/${m}`, import.meta.url), 'utf8'));
for (const m of ['0001_init.sql', '0002_supabase_storage.sql']) await migrate(m);
await db.exec(`insert into public.admin_users values ('${ADMIN}');`);

/** Chạy câu lệnh dưới một role, với user (sub) cụ thể; luôn rollback để test độc lập. */
async function as(role, sub, sql) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ''}', true);`);
    return await db.query(sql);
  } finally {
    await db.exec('rollback');
  }
}

const full = `title_vi, title_en, summary_vi, summary_en, concept_vi, concept_en`;
const fullVals = `'A','A','B','B','C','C'`;

// Dữ liệu nền (chạy bằng superuser, bỏ qua RLS).
await db.exec(`
  insert into projects (id, slug, status, ${full}) values
    ('11111111-1111-1111-1111-111111111111', 'cong-khai', 'published', ${fullVals}),
    ('22222222-2222-2222-2222-222222222222', 'nhap', 'draft', 'Nháp','','','','','');
  insert into media_assets (id, project_id, kind, position, prefix, files, is_public) values
    ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'render', 10, 'p/1/a', '{w640.webp}', true),
    ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'render', 20, 'p/1/b', '{w640.webp}', true),
    ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'render', 10, 'p/2/a', '{w640.webp}', false);
`);
// Dữ liệu trên được tạo theo schema song ngữ cũ → chạy 0003 lên DB đang có dữ liệu, giống Supabase thật.
await migrate('0003_drop_english.sql');
await migrate('0004_about_image.sql');

test('khách (anon) chỉ thấy công trình đã xuất bản', async () => {
  const r = await as('anon', null, 'select slug from projects');
  assert.deepEqual(r.rows.map((x) => x.slug), ['cong-khai']);
});

test('khách không thấy media private của bản nháp', async () => {
  const r = await as('anon', null, 'select prefix from media_assets order by prefix');
  assert.deepEqual(r.rows.map((x) => x.prefix), ['p/1/a', 'p/1/b']);
});

test('user đăng nhập nhưng không phải admin: không thấy nháp, không ghi được', async () => {
  const r = await as('authenticated', OTHER, 'select slug from projects');
  assert.deepEqual(r.rows.map((x) => x.slug), ['cong-khai']);
  await assert.rejects(as('authenticated', OTHER, `insert into projects (slug) values ('x')`), /row-level security/);
  const u = await as('authenticated', OTHER, `update projects set title_vi = 'hack' returning id`);
  assert.equal(u.rows.length, 0);
});

test('user thường không tự thêm mình vào admin_users', async () => {
  await assert.rejects(as('authenticated', OTHER, `insert into admin_users values ('${OTHER}')`), /permission denied|row-level security/);
});

test('admin thấy cả nháp và ghi được', async () => {
  const r = await as('authenticated', ADMIN, 'select count(*)::int as n from projects');
  assert.equal(r.rows[0].n, 2);
  const i = await as('authenticated', ADMIN, `insert into projects (slug, title_vi) values ('moi', 'Mới') returning slug`);
  assert.equal(i.rows[0].slug, 'moi');
});

test('không xuất bản được khi thiếu mô tả/ý tưởng (constraint DB)', async () => {
  await assert.rejects(
    as('authenticated', ADMIN, `update projects set status = 'published' where slug = 'nhap'`),
    /publish_requires_content/,
  );
  const ok = await as('authenticated', ADMIN, `update projects set summary_vi = 'B', concept_vi = 'C', status = 'published' where slug = 'nhap' returning status`);
  assert.equal(ok.rows[0].status, 'published');
});

test('0003 xóa hết cột tiếng Anh, giữ dữ liệu tiếng Việt', async () => {
  const cols = await db.query(`select table_name, column_name from information_schema.columns where table_schema = 'public' and right(column_name, 3) = '_en'`);
  assert.deepEqual(cols.rows, []);
  const p = await db.query(`select title_vi, status from projects where slug = 'cong-khai'`);
  assert.deepEqual(p.rows, [{ title_vi: 'A', status: 'published' }]);
});

test('0004 ảnh Giới thiệu: media của site, admin đặt được, xóa ảnh thì settings về null', async () => {
  await assert.rejects(
    db.query(`insert into media_assets (project_id, kind, prefix, files) values ('11111111-1111-1111-1111-111111111111', 'about', 'x/about-p', '{w640.webp}')`),
    /media_owner/,
  );
  await db.exec(`insert into media_assets (id, kind, prefix, files, is_public) values ('bbbbbbbb-0000-0000-0000-000000000001', 'about', 'site/about', '{w640.webp}', true)`);
  const set = await as('authenticated', ADMIN, `update site_settings set about_media_id = 'bbbbbbbb-0000-0000-0000-000000000001' where id = 1 returning about_media_id`);
  assert.equal(set.rows[0].about_media_id, 'bbbbbbbb-0000-0000-0000-000000000001');
  // Ngoài transaction để kiểm tra on delete set null.
  await db.exec(`update site_settings set about_media_id = 'bbbbbbbb-0000-0000-0000-000000000001' where id = 1; delete from media_assets where id = 'bbbbbbbb-0000-0000-0000-000000000001';`);
  const after = await db.query(`select about_media_id from site_settings where id = 1`);
  assert.equal(after.rows[0].about_media_id, null);
});

test('slug phải là ASCII gạch nối', async () => {
  await assert.rejects(as('authenticated', ADMIN, `insert into projects (slug) values ('Nhà Phố')`), /check constraint/);
});

test('link JEGA phải thuộc host cho phép', async () => {
  await assert.rejects(
    as('authenticated', ADMIN, `update projects set jega_url = 'https://evil.example/x' where slug = 'nhap'`),
    /check constraint/,
  );
  const ok = await as('authenticated', ADMIN, `update projects set jega_url = 'https://www.jegaai.com/720/QQO1' where slug = 'nhap' returning jega_url`);
  assert.equal(ok.rows.length, 1);
});

test('move_media đổi chỗ trong cùng nhóm; user thường không đổi được', async () => {
  await db.exec('begin');
  try {
    await db.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${ADMIN}', true);`);
    await db.query(`select move_media('aaaaaaaa-0000-0000-0000-000000000002', -1)`);
    const r = await db.query(`select id, position from media_assets where project_id = '11111111-1111-1111-1111-111111111111' order by position`);
    assert.deepEqual(r.rows.map((x) => x.id.slice(-1)), ['2', '1']);
  } finally {
    await db.exec('rollback');
  }
  await as('authenticated', OTHER, `select move_media('aaaaaaaa-0000-0000-0000-000000000002', -1)`);
  const after = await db.query(`select position from media_assets where id = 'aaaaaaaa-0000-0000-0000-000000000002'`);
  assert.equal(after.rows[0].position, 20); // RLS chặn update → không đổi
});

test('settings: khách đọc được, không sửa được; admin sửa được', async () => {
  const r = await as('anon', null, 'select legal_name_vi from site_settings');
  assert.equal(r.rows[0].legal_name_vi, 'CÔNG TY TNHH TRANG NAM THỊNH');
  const u = await as('authenticated', OTHER, `update site_settings set phone = '1' returning id`);
  assert.equal(u.rows.length, 0);
  const a = await as('authenticated', ADMIN, `update site_settings set phone = '1' returning id`);
  assert.equal(a.rows.length, 1);
});

test('media hero/logo không gắn công trình; media công trình phải gắn công trình', async () => {
  await assert.rejects(
    as('authenticated', ADMIN, `insert into media_assets (kind, prefix, files) values ('render', 'x', '{a}')`),
    /media_owner/,
  );
  const ok = await as('authenticated', ADMIN, `insert into media_assets (kind, prefix, files) values ('hero', 'site/x', '{w640.webp}') returning id`);
  assert.equal(ok.rows.length, 1);
});

test('storage: bucket private/public tạo đúng, giới hạn 25 MB và chỉ nhận ảnh', async () => {
  const r = await db.query('select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id');
  assert.deepEqual(r.rows.map((b) => [b.id, b.public, Number(b.file_size_limit)]), [
    ['media-private', false, 26214400],
    ['media-public', true, 26214400],
  ]);
  assert.ok(r.rows.every((b) => !b.allowed_mime_types.includes('video/mp4')));
});

test('storage: khách và user thường không đọc/ghi object; admin được', async () => {
  await db.exec(`insert into storage.objects (bucket_id, name) values ('media-private', 'p/x/a/w640.webp')`);
  assert.equal((await as('anon', null, 'select * from storage.objects')).rows.length, 0);
  assert.equal((await as('authenticated', OTHER, 'select * from storage.objects')).rows.length, 0);
  await assert.rejects(
    as('authenticated', OTHER, `insert into storage.objects (bucket_id, name) values ('media-public', 'hack.webp')`),
    /row-level security/,
  );
  assert.equal((await as('authenticated', ADMIN, 'select * from storage.objects')).rows.length, 1);
  const ins = await as('authenticated', ADMIN, `insert into storage.objects (bucket_id, name) values ('media-public', 'p/x/b/w640.webp') returning id`);
  assert.equal(ins.rows.length, 1);
});

test('video_urls: tối đa 12 link; media không còn loại video', async () => {
  const many = Array.from({ length: 13 }, (_, i) => `'https://youtu.be/${i}'`).join(',');
  await assert.rejects(as('authenticated', ADMIN, `update projects set video_urls = array[${many}] where slug = 'nhap'`), /video_urls_max/);
  await assert.rejects(
    as(
      'authenticated',
      ADMIN,
      `insert into media_assets (project_id, kind, prefix, files) values ('22222222-2222-2222-2222-222222222222', 'video', 'v', '{video.mp4}')`,
    ),
    /media_assets_kind_check/,
  );
});
