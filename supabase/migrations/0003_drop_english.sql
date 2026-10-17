-- 0003 — Bỏ bản tiếng Anh (17/10/2026): website chỉ còn tiếng Việt. XÓA VĨNH VIỄN nội dung tiếng Anh đã nhập.
-- Chạy SAU 0002 trong Supabase SQL Editor, và chỉ SAU KHI đã deploy code không dùng cột _en
-- (code cũ vẫn ghi các cột này → lưu trong admin sẽ lỗi nếu xóa cột trước).

-- Xuất bản chỉ cần tên, mô tả, ý tưởng tiếng Việt (thay ràng buộc song ngữ của 0001).
alter table public.projects drop constraint publish_requires_bilingual;
alter table public.projects add constraint publish_requires_content check (
  status = 'draft' or (title_vi <> '' and summary_vi <> '' and concept_vi <> '')
);

alter table public.projects
  drop column title_en,
  drop column summary_en,
  drop column concept_en,
  drop column location_en,
  drop column style_en,
  drop column role_en;

alter table public.media_assets
  drop column alt_en,
  drop column caption_en;

alter table public.site_settings
  drop column hero_title_en,
  drop column hero_text_en,
  drop column about_en,
  drop column legal_name_en,
  drop column address_en;
