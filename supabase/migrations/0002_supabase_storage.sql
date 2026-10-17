-- 0002 — Chuyển media từ Cloudflare R2 sang Supabase Storage (không cần thẻ thanh toán), video công trình dùng YouTube.
-- Chạy SAU 0001 trong Supabase SQL Editor.

-- ───────────────────────── buckets ─────────────────────────
-- media-private: nháp (chỉ admin). media-public: công trình đã xuất bản, hero (đọc công khai qua URL).
-- Giới hạn ở chính bucket: 25 MB mỗi file, chỉ ảnh — Supabase từ chối file sai ngay khi upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media-private', 'media-private', false, 26214400, array['image/webp', 'image/png', 'image/jpeg']),
  ('media-public', 'media-public', true, 26214400, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- Chỉ admin được đọc/ghi/xóa object qua API (bucket public vẫn phục vụ file qua URL công khai cho khách).
create policy media_objects_admin on storage.objects for all to authenticated
  using (bucket_id in ('media-private', 'media-public') and public.is_admin())
  with check (bucket_id in ('media-private', 'media-public') and public.is_admin());

-- ───────────────────────── video YouTube ─────────────────────────
-- Danh sách link YouTube (unlisted) theo thứ tự hiển thị. Server kiểm tra định dạng link khi lưu.
alter table public.projects add column video_urls text[] not null default '{}'
  constraint video_urls_max check (cardinality(video_urls) <= 12);

-- Media không còn loại 'video' (file video không lưu trong storage nữa).
alter table public.media_assets drop constraint media_assets_kind_check;
alter table public.media_assets add constraint media_assets_kind_check
  check (kind in ('render', 'photo', 'drawing', 'tour_poster', 'hero', 'logo'));
