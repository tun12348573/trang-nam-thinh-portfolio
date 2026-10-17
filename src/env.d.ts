/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('./lib/supabase').SessionClient;
    user?: { id: string; email: string };
    /** Chế độ xem giao diện admin khi dev (xem middleware). */
    designPreview?: boolean;
  }
}

declare namespace Cloudflare {
  interface Env {
    /** Chỉ dùng khi dev, đặt trong .dev.vars. */
    ADMIN_DESIGN_PREVIEW?: string;
  }
}
