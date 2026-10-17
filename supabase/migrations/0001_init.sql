-- Schema v1 — website portfolio Trang Nam Thịnh.
-- Chạy trong Supabase SQL Editor (hoặc `supabase db push`). Xem SETUP.md.
-- Nguyên tắc: khách (anon) chỉ đọc công trình đã xuất bản + media public; mọi thao tác ghi yêu cầu user có trong admin_users.


-- ───────────────────────── admin ─────────────────────────
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- security definer: đọc admin_users mà không bị RLS của chính bảng đó chặn.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ───────────────────────── projects ─────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  category text not null default 'residential' check (category in ('residential', 'interior', 'other')),
  position int not null default 100,
  featured boolean not null default false,
  cover_media_id uuid,
  title_vi text not null default '',
  title_en text not null default '',
  summary_vi text not null default '',
  summary_en text not null default '',
  concept_vi text not null default '',
  concept_en text not null default '',
  location_vi text not null default '',
  location_en text not null default '',
  style_vi text not null default '',
  style_en text not null default '',
  role_vi text not null default '',
  role_en text not null default '',
  area_m2 numeric(10, 1) check (area_m2 > 0),
  year int check (year between 1900 and 2100),
  jega_url text check (jega_url is null or jega_url ~ '^https://(www\.jegaai\.com|720\.3vjia\.com)/'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- CONF-10: chỉ xuất bản khi đủ nội dung cả hai ngôn ngữ (chặn ở DB, không chỉ ở UI).
  constraint publish_requires_bilingual check (
    status = 'draft' or (
      title_vi <> '' and title_en <> '' and summary_vi <> '' and summary_en <> '' and concept_vi <> '' and concept_en <> ''
    )
  )
);

-- ───────────────────────── media ─────────────────────────
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  kind text not null check (kind in ('render', 'photo', 'drawing', 'video', 'tour_poster', 'hero', 'logo')),
  position int not null default 0,
  prefix text not null unique,          -- thư mục trong R2, ví dụ p/<project>/<media>
  files text[] not null,                -- tên file dưới prefix: w640.webp, original.pdf, video.mp4, poster.webp…
  width int,
  height int,
  bytes bigint not null default 0,
  alt_vi text not null default '',
  alt_en text not null default '',
  caption_vi text not null default '',
  caption_en text not null default '',
  -- điểm cắt thumbnail (object-position, %): ảnh bị crop trong thẻ sẽ giữ vùng này.
  focal_x smallint not null default 50 check (focal_x between 0 and 100),
  focal_y smallint not null default 50 check (focal_y between 0 and 100),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint media_project_fk foreign key (project_id) references public.projects (id) on delete cascade,
  -- media của site (hero/logo) không gắn công trình; media công trình phải gắn công trình.
  constraint media_owner check ((kind in ('hero', 'logo')) = (project_id is null))
);
create index media_project_idx on public.media_assets (project_id, kind, position);

alter table public.projects
  add constraint projects_cover_fk foreign key (cover_media_id) references public.media_assets (id) on delete set null;

-- ───────────────────────── settings ─────────────────────────
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  hero_mode text not null default 'image' check (hero_mode in ('image', 'video')),
  hero_media_id uuid,
  hero_title_vi text not null default '',
  hero_title_en text not null default '',
  hero_text_vi text not null default '',
  hero_text_en text not null default '',
  about_vi text not null default '',
  about_en text not null default '',
  legal_name_vi text not null default 'CÔNG TY TNHH TRANG NAM THỊNH',
  legal_name_en text not null default 'Trang Nam Thinh Co., Ltd.',
  tax_code text not null default '',
  address_vi text not null default '',
  address_en text not null default '',
  logo_media_id uuid,
  phone text not null default '',
  zalo text not null default '',
  email text not null default '',
  jega_embed_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint settings_hero_fk foreign key (hero_media_id) references public.media_assets (id) on delete set null,
  constraint settings_logo_fk foreign key (logo_media_id) references public.media_assets (id) on delete set null
);
insert into public.site_settings (id) values (1);

-- updated_at tự động
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();

-- Đổi chỗ media với phần tử kề trong cùng nhóm (cùng công trình + cùng kind). Một lời gọi = một subrequest.
-- security invoker → RLS áp dụng: chỉ admin cập nhật được.
create or replace function public.move_media(media_id uuid, direction int) returns void
language plpgsql security invoker set search_path = public as $$
declare
  m media_assets;
  other media_assets;
begin
  select * into m from media_assets where id = media_id;
  if not found then raise exception 'media not found'; end if;
  if direction < 0 then
    select * into other from media_assets
      where project_id is not distinct from m.project_id and kind = m.kind and position < m.position
      order by position desc limit 1;
  else
    select * into other from media_assets
      where project_id is not distinct from m.project_id and kind = m.kind and position > m.position
      order by position asc limit 1;
  end if;
  if not found then return; end if;
  update media_assets set position = other.position where id = m.id;
  update media_assets set position = m.position where id = other.id;
end $$;
grant execute on function public.move_media(uuid, int) to authenticated;

-- ───────────────────────── RLS ─────────────────────────
alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;

-- admin_users: user chỉ đọc được dòng của chính mình; KHÔNG có policy ghi → chỉ thêm qua SQL Editor/service role.
create policy admin_users_self_read on public.admin_users for select to authenticated using (user_id = auth.uid());

create policy projects_public_read on public.projects for select to anon, authenticated
  using (status = 'published' or public.is_admin());
create policy projects_admin_write on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy media_public_read on public.media_assets for select to anon, authenticated
  using (is_public or public.is_admin());
create policy media_admin_write on public.media_assets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_admin_update on public.site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Quyền bảng (Supabase mặc định đã cấp cho anon/authenticated; ghi rõ để migration tự đủ).
grant select on public.projects, public.media_assets, public.site_settings to anon;
grant select, insert, update, delete on public.projects, public.media_assets to authenticated;
grant select, update on public.site_settings to authenticated;
grant select on public.admin_users to authenticated;
