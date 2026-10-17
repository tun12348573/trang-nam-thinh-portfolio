// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  // ponytail: không dùng Astro sessions (auth nằm trong cookie Supabase) → không cần KV.
  session: false,
  devToolbar: { enabled: false },
  // Chống CSRF: từ chối POST form/API có Origin khác website (mặc định đã bật — ghi rõ để không vô tình tắt).
  security: { checkOrigin: true },
  adapter: cloudflare({
    // Ảnh đã được resize lúc upload (CONF-16) → không dùng Cloudflare Images.
    imageService: 'passthrough',
  }),
  vite: {
    plugins: [tailwindcss()],
    // Dev: đóng gói sẵn client Supabase cho script admin trên trình duyệt (admin-storage.ts);
    // không khai báo thì Vite phát hiện muộn và trả 404 cho file deps → upload/xuất bản không chạy.
    optimizeDeps: { include: ['@supabase/ssr'] },
  },
});
