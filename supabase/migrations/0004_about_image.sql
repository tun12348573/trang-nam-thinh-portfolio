-- 0004 — Ảnh cho mục Giới thiệu trên trang chủ (19/10/2026). Chạy SAU 0003 trong Supabase SQL Editor.
-- Thứ tự với deploy không quan trọng: code đọc about_media_id nếu có, chưa có cột thì bỏ qua.

-- Loại media mới 'about': media của site (không gắn công trình), giống hero/logo.
alter table public.media_assets drop constraint media_assets_kind_check;
alter table public.media_assets add constraint media_assets_kind_check
  check (kind in ('render', 'photo', 'drawing', 'tour_poster', 'hero', 'logo', 'about'));

alter table public.media_assets drop constraint media_owner;
alter table public.media_assets add constraint media_owner
  check ((kind in ('hero', 'logo', 'about')) = (project_id is null));

-- Xóa ảnh → cài đặt tự về null (mục Giới thiệu quay lại bố cục chỉ có chữ).
alter table public.site_settings add column about_media_id uuid
  constraint settings_about_fk references public.media_assets (id) on delete set null;
