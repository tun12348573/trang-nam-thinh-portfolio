import type { Media } from './types';

export const IMAGE_WIDTHS = [640, 1280, 2400] as const;
export const LIMITS = {
  imageBytes: 25 * 1024 * 1024, // mỗi biến thể WebP / file gốc bản vẽ (bucket cũng giới hạn 25 MB)
} as const;

/** Hàm dựng URL cho một file của media: public base khi công khai, endpoint admin khi xem trước. */
export type FileUrl = (m: Media, file: string) => string;

export const publicFileUrl =
  (base: string): FileUrl =>
  (m, file) =>
    `${base.replace(/\/$/, '')}/${m.prefix}/${file}`;

export const adminFileUrl: FileUrl = (m, file) => `/api/admin/media-file?id=${m.id}&f=${encodeURIComponent(file)}`;

/** src/srcset cho ảnh đã resize (w640.webp, w1280.webp, w2400.webp). */
export function imageAttrs(m: Media, url: FileUrl, sizes: string) {
  const variants = m.files
    .map((f) => ({ f, w: Number(f.match(VARIANT)?.[1]) }))
    .filter((v) => v.w)
    .sort((a, b) => a.w - b.w);
  const mid = variants.find((v) => v.w >= 1280) ?? variants.at(-1);
  return {
    src: mid ? url(m, mid.f) : '',
    srcset: variants.map((v) => `${url(m, v.f)} ${v.w}w`).join(', '),
    sizes,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
  };
}

/** Biến thể ảnh: w640.webp… (resize lúc upload) hoặc w1200.jpg (poster JEGA lấy từ og:image). */
const VARIANT = /^w(\d+)\.(webp|jpe?g|png)$/;

export const largestImage = (m: Media) =>
  m.files.filter((f) => VARIANT.test(f)).sort((a, b) => parseInt(b.slice(1)) - parseInt(a.slice(1)))[0];

export const originalFile = (m: Media) => m.files.find((f) => f.startsWith('original.'));
