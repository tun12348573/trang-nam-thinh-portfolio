export const CATEGORIES = ['residential', 'interior', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const MEDIA_KINDS = ['render', 'photo', 'drawing', 'tour_poster', 'hero', 'logo', 'about'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Một ảnh. Mọi file nằm dưới `prefix` trong bucket Supabase (private hoặc public theo `is_public`); `files` liệt kê tên file. */
export interface Media {
  id: string;
  project_id: string | null;
  kind: MediaKind;
  position: number;
  prefix: string;
  files: string[];
  width: number | null;
  height: number | null;
  bytes: number;
  alt_vi: string;
  caption_vi: string;
  /** Điểm cắt thumbnail (%, object-position). */
  focal_x: number;
  focal_y: number;
  is_public: boolean;
}

export interface Project {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  category: Category;
  position: number;
  featured: boolean;
  cover_media_id: string | null;
  title_vi: string;
  summary_vi: string;
  concept_vi: string;
  location_vi: string;
  style_vi: string;
  role_vi: string;
  area_m2: number | null;
  year: number | null;
  jega_url: string | null;
  /** Link YouTube (unlisted) của video render, theo thứ tự. */
  video_urls: string[];
  published_at: string | null;
  media?: Media[];
}

export interface SiteSettings {
  hero_mode: 'image' | 'video';
  hero_media_id: string | null;
  hero_title_vi: string;
  hero_text_vi: string;
  about_vi: string;
  legal_name_vi: string;
  tax_code: string;
  address_vi: string;
  logo_media_id: string | null;
  /** Ảnh mục Giới thiệu (migration 0004; chưa chạy migration thì không có trường này). */
  about_media_id?: string | null;
  phone: string;
  zalo: string;
  email: string;
  jega_embed_enabled: boolean;
  hero_media?: Media | null;
  logo_media?: Media | null;
  about_media?: Media | null;
}

/** Trường bắt buộc trước khi xuất bản (DB chặn thêm bằng constraint publish_requires_content). */
export const REQUIRED_FIELDS = ['title', 'summary', 'concept'] as const;
