import type { Category } from './types';

// Website chỉ dùng tiếng Việt (bỏ bản tiếng Anh ngày 17/10/2026). Chữ giao diện tập trung ở đây để sửa một chỗ.

export const BRAND = 'Trang Nam Thịnh';

export const PATHS = {
  home: '/',
  projects: '/cong-trinh',
  project: (slug: string) => `/cong-trinh/${slug}`,
} as const;

export const CATEGORY_LABEL: Record<Category, string> = {
  residential: 'Nhà ở',
  interior: 'Nội thất',
  other: 'Công trình khác',
};

export const TEXT = {
  nav_projects: 'Công trình',
  nav_about: 'Giới thiệu',
  nav_contact: 'Liên hệ',
  hero_cta: 'Khám phá công trình',
  hero_title_fallback: 'Kiến tạo không gian\nmang dấu ấn riêng',
  selected_title: 'Công trình tiêu biểu',
  selected_text: 'Một số công trình chúng tôi đã thiết kế — từ ý tưởng, phối cảnh tới hồ sơ bản vẽ.',
  featured_label: 'Công trình nổi bật',
  view_project: 'Xem công trình',
  all_projects: 'Tất cả công trình',
  about_title: 'Giới thiệu',
  contact_title: 'Liên hệ',
  filter_all: 'Tất cả',
  empty_projects: 'Chưa có công trình nào được xuất bản.',
  area: 'Diện tích',
  year: 'Năm',
  location: 'Địa điểm',
  style: 'Phong cách',
  role: 'Vai trò thiết kế',
  category: 'Loại hình',
  concept: 'Ý tưởng thiết kế',
  renders: 'Phối cảnh',
  photos: 'Ảnh thực tế',
  videos: 'Video render',
  drawings: 'Bản vẽ',
  explore_space: 'Khám phá không gian',
  open_tour: 'Mở tour JEGA',
  load_tour: 'Bấm để tải tour 360°',
  related: 'Công trình liên quan',
  close: 'Đóng',
  prev: 'Ảnh trước',
  next: 'Ảnh sau',
  pause: 'Tạm dừng video',
  play: 'Phát video',
  image_pending: 'Ảnh đang chờ',
  phone: 'Điện thoại',
  email: 'Email',
  zalo: 'Zalo',
  tax_code: 'MST',
  demo_banner: 'DỮ LIỆU MINH HỌA — chưa kết nối Supabase. Không phải nội dung thật.',
  back_projects: 'Quay lại danh sách',
  zoom_actual: 'Phóng 100%',
  zoom_fit: 'Vừa khung',
} satisfies Record<string, string>;

/** Link /en cũ (trước khi bỏ tiếng Anh) → trang tiếng Việt tương ứng. null = không phải link /en. */
export function legacyEnRedirect(pathname: string): string | null {
  if (pathname !== '/en' && !pathname.startsWith('/en/')) return null;
  const slug = pathname.match(/^\/en\/projects\/([^/]+)\/?$/)?.[1];
  if (slug) return PATHS.project(slug);
  if (/^\/en\/projects\/?$/.test(pathname)) return PATHS.projects;
  return PATHS.home;
}
