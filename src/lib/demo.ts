import type { Media, MediaKind, Project, SiteSettings } from './types';

// Dữ liệu minh họa CHỈ dùng khi chưa cấu hình Supabase (dev). Trang hiển thị banner "DỮ LIỆU MINH HỌA".
// Không phải công trình thật. Ảnh minh họa cắt từ clip hero (public/media/demo, xem CONF-25) để kiểm thử gallery/lightbox/bản vẽ.

function dm(id: string, project_id: string, kind: MediaKind, dir: string, files: string[], width: number, height: number, position: number, alt: string): Media {
  return {
    id, project_id, kind, position, prefix: `media/demo/${dir}`, files, width, height, bytes: 0,
    alt_vi: `${alt} (minh họa)`, caption_vi: 'Ảnh minh họa', focal_x: 50, focal_y: 78, is_public: true,
  };
}

const WEBP = ['w640.webp', 'w1280.webp'];

export const demoSettings: SiteSettings = {
  hero_mode: 'image',
  hero_media_id: null,
  hero_title_vi: '',
  hero_text_vi: '[Đoạn mô tả ngắn — chờ nội dung thật từ chủ website]',
  about_vi: '[Phần giới thiệu doanh nghiệp — chờ nội dung thật]',
  legal_name_vi: 'CÔNG TY TNHH TRANG NAM THỊNH',
  tax_code: '',
  address_vi: '',
  logo_media_id: null,
  phone: '',
  zalo: '',
  email: '',
  jega_embed_enabled: true,
};

const base = {
  status: 'published' as const,
  featured: true,
  cover_media_id: null,
  location_vi: '',
  style_vi: '',
  role_vi: '',
  jega_url: null,
  video_urls: [],
  published_at: null,
  media: [],
};

export const demoProjects: Project[] = [
  {
    ...base,
    id: 'demo-1',
    slug: 'demo-cong-trinh-1',
    category: 'residential',
    position: 1,
    title_vi: '[Demo] Công trình 1',
    summary_vi: 'Nhà ở · dữ liệu minh họa',
    concept_vi: 'Dữ liệu minh họa để dựng bố cục. Thay bằng công trình thật qua trang quản trị.',
    area_m2: null,
    year: null,
    jega_url: 'https://www.jegaai.com/720/QQO202610100000000000001151671622',
    media: [
      dm('demo-m1', 'demo-1', 'render', 'r1', WEBP, 1912, 1080, 10, 'Phối cảnh mặt tiền'),
      dm('demo-m2', 'demo-1', 'render', 'r2', WEBP, 1100, 620, 20, 'Cận cảnh lối vào'),
      dm('demo-m3', 'demo-1', 'render', 'r3', WEBP, 1912, 1080, 30, 'Phối cảnh buổi tối'),
      dm('demo-m4', 'demo-1', 'drawing', 'd1', [...WEBP, 'original.png'], 2400, 1600, 10, 'Mặt bằng'),
    ],
  },
  {
    ...base,
    id: 'demo-2',
    slug: 'demo-cong-trinh-2',
    category: 'interior',
    position: 2,
    title_vi: '[Demo] Công trình 2',
    summary_vi: 'Nội thất · dữ liệu minh họa',
    concept_vi: 'Dữ liệu minh họa.',
    area_m2: null,
    year: null,
    media: [dm('demo-m5', 'demo-2', 'render', 'r3', WEBP, 1912, 1080, 10, 'Phối cảnh')],
  },
  {
    ...base,
    id: 'demo-3',
    slug: 'demo-cong-trinh-3',
    category: 'other',
    position: 3,
    title_vi: '[Demo] Công trình 3',
    summary_vi: 'Công trình khác · dữ liệu minh họa',
    concept_vi: 'Dữ liệu minh họa.',
    area_m2: null,
    year: null,
    media: [dm('demo-m6', 'demo-3', 'render', 'r2', WEBP, 1100, 620, 10, 'Phối cảnh')],
  },
];
