# PROJECT_STATE — Tiến độ thực tế

Cập nhật: 17/10/2026

## Trạng thái hiện tại

- Code website v1: Astro 7 + `@astrojs/cloudflare` 14 + Tailwind 4, Supabase (`@supabase/ssr`) cho database, đăng nhập và lưu ảnh. Video công trình qua YouTube.
- Trang công khai **chỉ tiếng Việt** từ 17/10/2026 (link `/en` cũ chuyển 301). Chạy được ở chế độ **dữ liệu minh họa** (banner vàng, `noindex`) khi chưa cấu hình Supabase.
- CMS (đăng nhập, CRUD, upload, sắp xếp, ảnh bìa, xem trước, xuất bản/gỡ xuất bản, cài đặt trang, hero) đã viết đầy đủ nhưng **chưa chạy với Supabase/R2 thật** — chưa có tài khoản dịch vụ. Không có Docker nên không chạy được Supabase local.
- Đã deploy: https://trang-nam-thinh-portfolio.trang-nam-thinh-portfolio.workers.dev (chưa có tên miền riêng).

## Bằng chứng kiểm tra (15/10/2026)

| Kiểm tra | Lệnh | Kết quả |
| --- | --- | --- |
| Typecheck | `npm run check` | 0 lỗi, 0 cảnh báo (52 file) |
| Build | `npm run build` | Thành công |
| Bundle Worker | `wrangler deploy --dry-run` | 1.579 KiB, gzip 374 KiB (giới hạn 64 MiB) |
| Migration + RLS | `npm run test:db` (PGlite, mô phỏng role anon/authenticated + `auth.uid()`) | 11/11 pass: anon chỉ thấy bản đã xuất bản và media public; user không phải admin không đọc nháp/không ghi/không tự thêm vào `admin_users`; constraint song ngữ chặn xuất bản; slug ASCII; host JEGA; `move_media`; settings; ràng buộc media hero/công trình |
| Responsive | `npm run qa:shots -- http://localhost:4321 / /en /cong-trinh /en/projects /cong-trinh/demo-cong-trinh-1 /en/projects/demo-cong-trinh-1` | 18/18 OK ở 390/768/1440 px, không tràn ngang. Ảnh trong `qa/` |
| Chuyển ngôn ngữ / hreflang | Playwright | `/cong-trinh/x` ↔ `/en/projects/x` giữ đúng trang; `hreflang` vi/en/x-default đúng |
| Cache header | `curl` | Trang công khai `public, max-age=0, s-maxage=60`; admin trả 503 khi chưa cấu hình Supabase |
| 404 | `curl /cong-trinh/khong-ton-tai` | 404 |
| Tour JEGA (QA-07, một phần) | `node scripts/qa-jega.mjs` | Iframe chỉ tạo sau khi bấm; trong Chromium phiên khách tour render được (`qa/jega-iframe.png`). Có nút **Replace product** (mua hàng) trong iframe |
| Đối chiếu tham chiếu (QA-01) | `qa/home-1440.png` so với `references/*.jpg` | Khớp bố cục: header nhỏ, headline 2 dòng nét thường bên trái (~44% chiều rộng, mẫu ~46%), nút tối, chữ nhỏ bên phải, hero ~1,36:1, 3 ô ảnh, khối chữ trái + ảnh lớn phải. Hero và ảnh đang là placeholder nên **chưa so được màu, cách cắt ảnh và cảm giác tổng thể** |

## Chưa kiểm tra được (cần tài khoản/asset)

- Toàn bộ luồng CMS với Supabase thật: đăng nhập, upload (resize WebP trong trình duyệt, upload thẳng Supabase Storage), xuất bản (copy sang bucket public), gỡ xuất bản, xem trước, cài đặt — QA-04, QA-05 (phần storage), QA-06, QA-08.
- Gallery/lightbox/bản vẽ zoom đã kiểm tra bằng media demo (QA-03). Hero video đã kiểm tra (QA-09). Video player trong trang công trình (thẻ `<video controls>` gốc) chưa thử với file thật.
- Cache API 60 giây: chỉ chạy trên custom domain.
- Cron keep-alive Supabase: chỉ chạy sau deploy.
- Safari: chưa thử; Safari không mã hóa WebP bằng canvas (ghi trong SETUP.md).

## Thông tin/asset còn thiếu

1. Tài khoản Supabase và Cloudflare, thực hiện theo `SETUP.md`.
2. Xem có tắt được nút "Replace product" của JEGA không; nếu không, bỏ chọn "Nhúng tour" trong `/admin/settings`.
3. Nội dung của ít nhất một công trình thật.
4. Mã số thuế, địa chỉ, điện thoại, Zalo, email (nhập trong `/admin/settings`).
5. Tên miền trước khi công khai.

## Bản đồ code

| Phần | Vị trí |
| --- | --- |
| Design tokens | `src/styles/global.css` (`@theme`) |
| Tên thương hiệu ngắn, văn bản giao diện, đường dẫn, chuyển hướng `/en` cũ | `src/lib/text.ts` |
| Trang công khai | `src/views/HomePage.astro`, `ProjectsPage.astro`, `ProjectDetail.astro`; route trong `src/pages/` |
| Hero, gallery, lightbox, tour JEGA | `src/components/` |
| Dữ liệu công khai / dữ liệu minh họa | `src/lib/data.ts`, `src/lib/demo.ts` |
| Admin | `src/pages/admin/`, `src/pages/api/admin/`, `src/lib/admin.ts`, `src/components/admin/` |
| Bảo vệ admin + header cache | `src/middleware.ts` |
| Cache edge + cron | `src/worker.ts` |
| Lưu ảnh (Supabase Storage) | `src/lib/storage.ts` (dùng chung), `src/lib/admin-storage.ts` (trình duyệt admin) |
| Schema + RLS | `supabase/migrations/0001_init.sql` … `0003_drop_english.sql`, test `supabase/tests/rls.test.mjs` |

## Việc tiếp theo

1. **Đợt bỏ tiếng Anh (17/10) chưa lên bản thật**: commit + `npm run deploy`, **sau đó** chạy `supabase/migrations/0003_drop_english.sql` trong Supabase SQL Editor (xóa vĩnh viễn cột `_en`; chạy trước khi deploy thì admin bản cũ lưu lỗi). Rồi kiểm tra `/en` → 301 trên bản thật.
2. Chủ website đăng nhập `/admin/login` trên bản thật để thử luồng quản trị (SETUP.md).
3. Tạo một công trình thật, chạy QA-03 đến QA-09 trên `workers.dev`, ghi kết quả vào đây.
4. Khi có ảnh hero thật: chạy lại đối chiếu QA-01 (prompt C), chỉnh `object-position` và cỡ headline nếu cần.

## Nhật ký thực hiện

- 15/10/2026 — Phiên chốt quyết định với chủ website. Cập nhật `PROJECT_CONTEXT.md` lên 1.1, `BUILD_PROMPT.md` (prompt A, D) và `README.md`. Đã kiểm tra link JEGA mẫu bằng `curl`: HTTP 200, không có `X-Frame-Options`/CSP `frame-ancestors`, không thấy code chặn nhúng, có `og:image`, có cấu hình `shopcar: true`. Đã tra giới hạn gói free của Cloudflare/R2/Supabase.
- 15/10/2026 — Triển khai v1 theo prompt A. Dựng landing page, danh sách, chi tiết song ngữ; CMS đầy đủ; migration + RLS + test PGlite; SETUP.md. Kiểm tra: xem bảng "Bằng chứng kiểm tra". Lưu ý môi trường: npm 12.2 cảnh báo không hỗ trợ Node 22.20 (vẫn chạy được; nên nâng Node lên ≥ 22.22.2); npm 12 chặn install script → đã cho phép riêng `workerd` và `esbuild` trong `allowScripts`. Chưa có ESLint (chỉ typecheck bằng `astro check`).

- 15/10/2026 — Đưa clip hero của chủ website vào landing page (`public/media/hero.mp4` + `hero-poster.webp` lấy từ frame đầu, 83 KB); sửa `src/components/Hero.astro`. Kiểm tra bằng Edge (Playwright, `channel: 'msedge'` vì Chromium của Playwright không có H.264):
  - Tự chạy và dừng ở khung cuối với nút "Phát video" ở 1440/1024/768/390 px. Không tràn ngang.
  - Bật reduced motion: không tự chạy, giữ poster. Nút điều khiển dùng được bằng bàn phím.
  - Màu trời đo được `244,243,237`, trùng màu nền.
  - QA 18/18 trang; `astro check` 0 lỗi; build có kèm media.
  - Đối chiếu QA-01 ở 1440 px: bố cục hero khớp mẫu (headline trên vùng trời, trọn nhà và xe ở nửa dưới).
  - Giới hạn: clip có vệt nhiễu mờ trong vùng trời, đã che phần lớn nhưng vẫn thấy rất nhẹ ở khoảng 35–50% chiều cao. Video 8 MB tải trên mọi thiết bị, kể cả điện thoại.

- 15/10/2026 — Chủ website xác nhận clip hero chỉ là hình minh họa (ghi vào CONF-25).
  - **Media demo**: `public/media/demo/` (368 KB) gồm 3 ảnh cắt từ clip và 1 mặt bằng ghi "BẢN VẼ MINH HỌA — DEMO". Chỉ dùng trong dữ liệu demo, có nhãn "(minh họa)".
  - **Bổ sung "điểm cắt thumbnail"** (mục 9 brief, trước đó còn thiếu): cột `focal_x`/`focal_y` trong `media_assets`; admin bấm vào thumbnail để chọn điểm hoặc nhập %; trang công khai dùng `object-position`.
  - **QA-03** (`node scripts/qa-gallery.mjs`): 6/6 đạt.
    - 7 ảnh tải được và đủ alt.
    - Lightbox mở ảnh full; phím → chuyển ảnh; Escape đóng và trả focus về nút đã mở.
    - Bản vẽ: thumbnail `contain`, lightbox mở file gốc 2400 px, "Phóng 100%" cuộn được.
    - Mobile 390 px không tràn ngang.
  - QA 18/18 trang; `astro check` 0 lỗi; `test:db` 11/11.
  - Đã thử cho ảnh blend `multiply` vào nền giống hero, rồi bỏ: ô ảnh mất cạnh chữ nhật, lệch mẫu.

- 15/10/2026 — **Bỏ Cloudflare R2, chuyển sang Supabase Storage + YouTube** (R2 bắt buộc thêm thẻ thanh toán; chủ website chọn phương án không cần thẻ). Cập nhật CONF-12/14/15.
  - Migration `0002_supabase_storage.sql`: bucket `media-private`/`media-public` (25 MB, chỉ ảnh), RLS `storage.objects` chỉ admin, cột `projects.video_urls`, bỏ loại media `video`.
  - Thao tác file (upload, chuyển bucket khi xuất bản/gỡ, xóa) chạy trong trình duyệt admin (`src/lib/admin-storage.ts`) vì giới hạn 50 subrequest của Workers Free; server chỉ kiểm tra và đổi trạng thái.
  - Video công trình: link YouTube, hiển thị bằng `src/components/YouTube.astro` (tải iframe youtube-nocookie khi bấm). Admin không còn upload video; hero mặc định là video trong `public/media`, admin chỉ thay được bằng ảnh.
  - Bỏ `aws4fetch`, `src/lib/r2.ts`, endpoint presign/complete; `wrangler.jsonc` không còn binding/secret nào.
  - Kiểm tra: `astro check` 0 lỗi; build OK; `test:db` 14/14 (thêm 3 test storage/video); hàm đọc link YouTube đúng với watch/youtu.be/shorts/m., từ chối vimeo/link sai; trang công khai chạy với Supabase thật (project `uqmtpqwzrumfzxfrbuwf`, Singapore): 200, không banner demo, danh sách trống đúng; `/admin/projects` → login; API admin 401 khi chưa đăng nhập. QA 12/12 trang.
  - **Chưa kiểm tra**: đăng nhập admin và toàn bộ luồng upload/xuất bản/gỡ/xóa với Supabase thật (cần chủ website đăng nhập); migration 0002 chưa chạy trên Supabase.

- 15/10/2026 — **Chạy thật với Supabase + sửa lỗi admin + rà soát UI/UX.**
  - Chủ website đăng nhập admin, upload ảnh, xuất bản công trình "Nhà Hà Phát" lên Supabase thật — luồng upload → xuất bản chạy được.
  - Lỗi đã sửa: (1) Vite dev 404 `@supabase/ssr` → `optimizeDeps.include`; (2) middleware sửa header của response redirect bất biến → `withHeaders` tạo bản sao; (3) `form.action` bị nút `name="action"` che → `getAttribute('action')`; (4) đăng nhập báo đúng nguyên nhân (provider email tắt, chưa xác nhận email, chưa có trong admin_users); (5) ô Diện tích chỉ nhận số, lỗi số ghi tên trường tiếng Việt; (6) move ảnh chỉ bỏ qua lỗi khi xác nhận file đã ở bucket đích.
  - Rà soát UI/UX (skill ui-ux-pro-max): chữ phụ `#747970` → `#61665e` (4.01 → 5.29:1, đạt WCAG AA); chữ thân 16px trên điện thoại; chữ nhỏ nhất 12px; mọi link/nút ≥ 44px trên 390px (padding + margin âm, không đổi vị trí chữ); video hero không tự chạy khi Data Saver; khu "Công trình nổi bật" không lặp lại công trình đã có ở 3 ô; dev không dùng cache 60 giây.
  - Kiểm tra: `node scripts/qa-a11y.mjs` 12/12 OK (6 trang × 390/1440: vùng bấm, chữ < 12px, alt, tràn ngang); `astro check` 0 lỗi; build OK (cache vẫn có trong bản build).
  - Bỏ qua: báo lỗi form admin ngay cạnh ô (hiện báo ở đầu trang) → làm khi form admin dài thêm hoặc có người dùng khác ngoài chủ website.

- 15/10/2026 — **Rà soát UI/UX trang admin.**
  - Nhãn bọc ô nhập (`<label class="field"><span>…</span><input></label>`): bấm nhãn focus ô, trình đọc màn hình đọc được tên ô (trước đó nhãn không gắn với ô).
  - Form `data-keep` (đăng nhập, tạo công trình, sửa công trình, cài đặt): lưu bằng fetch; lỗi → giữ nguyên nội dung đã gõ, báo ngay cạnh nút (`[data-status]`), nút hiện "Đang lưu…". Trước đó lưu lỗi thì trang tải lại và mất nội dung.
  - Cảnh báo khi rời trang mà form còn thay đổi chưa lưu; upload ảnh xong không tự tải lại nếu form chưa lưu.
  - Ô nhập/nút/link header/nút "Sửa" cao ≥ 44px; chữ nhãn 13px; ô sai viền đỏ (`:user-invalid`); bỏ ?ok=/?err= khỏi URL sau khi hiện.
  - Kiểm tra (Playwright, trang đăng nhập 390px): bấm nhãn → focus đúng ô; sai mật khẩu → email còn giữ, thông báo cạnh nút, nút bật lại; không phần tử nào < 44px; không lỗi JS. Các trang admin cần đăng nhập chưa chạy kiểm tra tự động (không có phiên admin) — rà theo mã nguồn; `astro check` 0 lỗi.

- 16/10/2026 — **Thiết kế lại giao diện admin** theo shot Dribbble "E-commerce Branding Management Flow | Seller Admin UI" (Arafat Rahman) do chủ website chọn.
  - `src/styles/admin.css` (token riêng cho admin: olive #686852, card #F3F3F1, font Be Vietnam Pro; chỉnh để đạt AA: chữ ≥ 4.5:1, viền ô nhập #8C8C84 ≥ 3:1), `src/components/admin/Icon.astro` (Lucide, `lucide-static@1.49.0` ghim bản cũ ≥ 2 tuần, import từng SVG).
  - Layout: sidebar (viên thuốc olive cho mục đang chọn), thanh trên + avatar, tiêu đề trang có ô icon và nhóm nút dính khi cuộn, toast thành công, menu cuộn ngang trên điện thoại.
  - Sửa công trình: 2 cột — form (Thông tin chung / Nội dung song ngữ / Tour & video) + cột phải dính (Xem trước: ảnh bìa, dải ảnh, ô "+"; Trạng thái: checklist điều kiện xuất bản). Ảnh: lưới thẻ, nút icon ↑ ↓ ★ xóa, mô tả/điểm cắt thu gọn. Tải ảnh: vùng kéo-thả. Danh sách: thẻ thống kê + dòng có ảnh bìa, nhãn trạng thái. Đăng nhập: thẻ giữa màn hình.
  - Giữ nguyên chức năng (cùng id/data-* cho script xuất bản, upload, xóa, điểm cắt, data-keep); nút ngoài form dùng `form="…"` + `[data-status-for]`.
  - Chế độ xem giao diện chỉ khi dev: `ADMIN_DESIGN_PREVIEW=1` trong `.dev.vars` → vào /admin không cần đăng nhập, đọc dữ liệu với quyền khách (ghi bị RLS chặn), có dải cảnh báo; bản build không chứa nhánh này (đã kiểm tra). Đã xóa .dev.vars sau QA.
  - Kiểm tra: `node scripts/qa-admin.mjs` 10/10 OK (5 trang × 1440/390: không lỗi JS, không tràn ngang, vùng bấm ≥ 44px); sửa lỗi mục menu đang chọn trên mobile bị nền trắng che chữ; `astro check` 0 lỗi; build OK; `test:db` 14/14; trang công khai `qa-a11y` 6/6.

- 16/10/2026 — **Rà lỗi, bảo mật, chống quá tải trước khi deploy.**
  - Bảo mật: sửa XSS tiềm ẩn ở JSON-LD (thoát "<"); header cho mọi response (nosniff, Referrer-Policy, Permissions-Policy, HSTS khi https; công khai `frame-ancestors 'self'`, admin `frame-ancestors 'none'` + `form-action 'self'` + no-store); `security.checkOrigin` ghi rõ (POST từ origin lạ → 403, đã thử); giới hạn đăng nhập sai 8 lần/IP/15 phút (đã thử: lần 9 bị khóa, không gọi Supabase). `npm audit` 0 lỗ hổng; không có secret trong repo.
  - Quá tải: bộ nhớ đệm dữ liệu công khai trong Worker 60 giây (chạy cả trên workers.dev), gộp request đồng thời, Supabase lỗi → trả dữ liệu cũ; trang chi tiết dùng chung danh sách đã đệm (1 truy vấn thay vì 3); trang 500 thân thiện không gọi Supabase, có Retry-After.
  - Bỏ qua: CSP script-src đầy đủ (trang dùng script nội tuyến của Astro, Google Fonts, Supabase, iframe JEGA/YouTube) → làm khi có tên miền riêng và đo đủ nguồn; giới hạn đăng nhập đếm theo isolate → muốn chặt hơn bật Cloudflare Rate Limiting rule cho /api/admin/login.

- 16/10/2026 — **Push GitHub + deploy.**
  - GitHub: https://github.com/tun12348573/trang-nam-thinh-portfolio — nhánh `main`. `qa/` (ảnh chụp kiểm tra) không đưa lên repo.
  - Cloudflare Workers: https://trang-nam-thinh-portfolio.trang-nam-thinh-portfolio.workers.dev, Cron `0 3 * * *` ping Supabase. Subdomain workers.dev mới cần ~2 phút để có chứng chỉ SSL.
  - Kiểm tra trên bản thật: 10 đường dẫn đúng mã (200 / 404 / 302 về login); HSTS + header bảo mật; POST từ origin lạ → 403; ảnh Supabase 200 image/webp; video hero tự chạy; `qa-a11y` 8/8 OK; không lỗi JS.
  - Thử tải (`node scripts/load-test.mjs <url> 300 30`): 300/300 mã 200, ~150 req/s, p50 77 ms · p95 638 ms · max 1,4 s.
  - Còn lại: chủ website đăng nhập /admin trên bản thật để thử; mua tên miền + gắn vào Worker (cache 60 giây ở edge chỉ chạy trên tên miền riêng); bật Cloudflare Web Analytics.

- 16/10/2026 (21:52–22:39, ghi bù ngày 17/10) — **Hero vừa màn hình + gọn trang sửa công trình.** 6 commit `302ddd5` → `619f73d`, đã push `origin/main`.
  - `src/components/Hero.astro`: từ 1024 px, hero cao = min(16:9, màn hình − menu), video phủ ngang, neo đáy (màn hình thấp chỉ cắt trời phía trên). Cỡ headline tính bằng CSS (`--fs-wide` / `--fs-corner`, lấy cỡ lớn hơn): đủ cao → chữ lớn trên mái; thấp → chữ nhỏ ở cột trời bên trái nhà. Lớp trắng che nhiễu chỉ phủ phần trời còn lại. Dưới 640 px: video 4:5, `object-position` 55%, headline 34px. Quyết định ghi ở `PROJECT_CONTEXT.md` mục 8.
  - `src/pages/admin/projects/[id].astro`: bỏ cột phải "Xem trước" (ảnh bìa, dải ảnh, nút Bản VI/EN, Trang công khai) và "Trạng thái" (checklist xuất bản); nội dung rộng tối đa 60rem. `src/pages/admin/login.astro`: bỏ dòng hướng dẫn admin_users.
  - Lần deploy cuối (`wrangler deployments list`): 16/10 22:39 (+07), cùng phút commit `619f73d` → nhiều khả năng bản thật là HEAD; wrangler không ghi commit nên chưa xác nhận chắc.

- 17/10/2026 — **Đối chiếu nhật ký với code + QA lại sau đợt hero.** Không sửa code.
  - `npm run check`: 0 lỗi, 0 cảnh báo (54 file). `npm run test:db`: 14/14 pass. `npm run build`: OK.
  - Dev server dùng Supabase thật (`wrangler.jsonc`), có 2 công trình đã xuất bản (`nha-ha-phat`, `cong-ty-ke-toan`).
  - `npm run qa:shots` (/, /en, danh sách, `nha-ha-phat` VI/EN): 18/18 OK, không tràn ngang. `node scripts/qa-a11y.mjs` cùng 6 trang: 12/12 OK.
  - Hero (script tạm, không đưa vào repo; đo khung chữ thật của headline và nút so với mái/cây theo tỷ lệ ghi trong `Hero.astro`): 13/13 OK ở 2560×1440, 1920×1080, 1536×864, 1440×900, 1440×700, 1366×768, 1280×720, 1280×600, 1024×768, 1024×600, 768×1024, 390×844, 360×740 — chữ/nút không đè nhà, hero nằm trọn màn hình đầu. Đã xem ảnh 1440×900, 1280×600, 1024×600, 390×844: khớp kết quả đo.
  - `node scripts/qa-admin.mjs` (login, danh sách, tạo mới, cài đặt, sửa công trình) với `ADMIN_DESIGN_PREVIEW=1`: 10/10 OK. Đã xóa `.dev.vars` sau QA.
  - Xuất bản vẫn báo đủ trường còn thiếu (`missingForPublish` trong `src/lib/admin.ts`, trả về khi bấm xuất bản) — chỉ mất checklist hiển thị trước.
  - Phát hiện cần chủ website quyết:
    1. Trang sửa công trình chỉ còn nút "Xem trước" bản VI; xem bản EN phải tự sửa URL thành `?lang=en`, không còn link "Trang công khai".
    2. Điện thoại 390 px: video 4:5 cắt mất phần phải của nhà, không thấy xe (brief mục 11: hiện rõ toàn bộ công trình trọng tâm).
    3. 1440×900: vệt nhiễu trời vẫn thấy nhẹ bên phải headline (giới hạn của clip, đã ghi 15/10).
  - Lưu ý môi trường: Git Bash đổi tham số `/` thành đường dẫn Windows → chạy script QA với `MSYS_NO_PATHCONV=1`.
  - Việc tiếp theo: chủ website chọn cách xử lý điểm 1–2; thử luồng admin trên bản thật (QA-04/05/06/08).

- 17/10/2026 — **Bỏ bản tiếng Anh + chỉnh hero điện thoại** (chủ website quyết: cả website chỉ tiếng Việt, xóa hẳn cột `_en`, link `/en` cũ 301; hero giữ 4:5). Cập nhật CONF-08, CONF-10, mục 6/8/9/10/11/12 của `PROJECT_CONTEXT.md` (v1.2), `README.md`, `SETUP.md` (bước migration 0003 + thứ tự), `BUILD_PROMPT.md` (prompt A, D).
  - Code: bỏ kiểu `Lang`, hàm `loc()`, prop `lang` ở mọi component/view; `src/lib/i18n.ts` → `src/lib/text.ts` (`BRAND`, `PATHS`, `TEXT`, `CATEGORY_LABEL`, `legacyEnRedirect`); xóa `src/pages/en/`; header/footer bỏ nút English; bỏ `hreflang`, `og:locale` = `vi_VN`; 404/500 chỉ tiếng Việt; `src/middleware.ts` trả 301 cho `/en…` (giữ query). Admin: form công trình/cài đặt/mô tả ảnh một cột, bỏ nhãn VI/EN (`.a-lang`), danh sách hiện mô tả một dòng thay cho "Thiếu tên tiếng Anh"; xuất bản chỉ cần tên, mô tả, ý tưởng tiếng Việt + 1 ảnh. Nút xem trước bỏ `?lang=`.
  - DB: `supabase/migrations/0003_drop_english.sql` xóa 13 cột `_en` (projects 6, media_assets 2, site_settings 5), thay constraint `publish_requires_bilingual` bằng `publish_requires_content`. Giữ hậu tố `_vi` (không đổi tên cột trên DB thật). **Chưa chạy trên Supabase thật.**
  - Hero điện thoại (`src/components/Hero.astro`): `object-position` 55% → 45%. Khung 4:5 chỉ hiện ~45% chiều ngang video nên không thể thấy trọn nhà; đã so 38/45/55/62/70% trên khung cuối (xe đã đỗ): 45% thấy trọn xe + cửa chính + nửa trái nhà, 70% thấy tường phải nhưng mất xe.
  - Sửa thêm: link "quay lại chỉnh sửa" trên dải xem trước chỉ cao 15px trên 390px → `min-h-11` (lỗi có từ trước, lộ ra khi đưa trang xem trước vào QA).
  - Kiểm tra (dev, Supabase thật còn cột `_en` — code mới chỉ đọc `select *` và ghi `_vi` nên chạy được trước migration): `npm run check` 0 lỗi (51 file); `npm run test:db` 15/15 (chạy 0003 lên dữ liệu tạo theo schema cũ; thêm test "0003 xóa hết cột _en, giữ dữ liệu", test constraint mới); `npm run build` OK; `curl`: `/en`, `/en/`, `/en/xyz` → 301 `/`, `/en/projects?c=interior` → 301 `/cong-trinh?c=interior`, `/en/projects/nha-ha-phat` → 301 `/cong-trinh/nha-ha-phat`, `/enfoo` 404; HTML `lang="vi"`, không còn hreflang/English. `qa:shots` 12/12 (4 trang × 390/768/1440), `qa-a11y` 8/8, hero 13/13 cỡ màn hình, `qa-admin` 12/12 (thêm trang xem trước). Ảnh Edge khung cuối video ở 390px: thấy trọn xe.
  - Chưa kiểm tra: lưu/xuất bản trong admin thật (không có phiên admin; chế độ xem giao diện bị RLS chặn ghi).
  - Thứ tự lên bản thật: deploy code → chạy 0003 → thử lưu một công trình trong admin.
  - Thực tế: chủ website chạy 0003 trước khi deploy. Kiểm tra qua REST: 3 bảng không còn cột `_en`, dữ liệu VI và 2 công trình đã xuất bản còn nguyên. Đã deploy (version `ba8b1f79`); bản thật: `/en…` → 301, trang 200, 404 đúng, admin → login, API 401. Thay đổi lưu trong admin trong khoảng giữa chạy migration và deploy không vào DB.

- 18/10/2026 — **Sửa nút "Lưu" trang sửa công trình không lưu được (trả 404).** Chủ website báo: thêm link JEGA cho "Nhà Hà Phát", bấm Lưu → 404, link không còn.
  - Nguyên nhân (`src/layouts/Admin.astro`, script `data-keep`): tắt nút (`disabled`) rồi mới tạo `new FormData(form, button)` → nút disabled bị loại khỏi FormData → mất `action=save` → API vào nhánh "Thao tác không hợp lệ", trả JSON 400 không chuyển hướng → script vẫn `location.href = res.url` (= địa chỉ API) → GET → 404. DB xác nhận lần lưu không tới: `jega_url` null, `updated_at` vẫn 15/10 (có trigger `projects_touch`). Lỗi có từ khi nút Lưu chuyển lên thanh tiêu đề (16/10), không do đợt bỏ tiếng Anh. Thử bằng Playwright: nút disabled → FormData không có `action`.
  - Sửa: tạo FormData trước khi tắt nút; response không chuyển hướng (mọi API form trả 303) → báo lỗi cạnh nút, giữ nội dung, không mở URL API.
  - Kiểm tra (dev, `ADMIN_DESIGN_PREVIEW=1`): Lưu gửi `action=save`; link JEGA sai host → hiện "Link tour phải là HTTPS…", ở lại trang, giữ ô đã nhập; giả lập 500 → "Lưu không thành công (mã 500)…", không 404. Trang tour JEGA mẫu 5,6 KB, `og:image` khớp regex, ảnh 288 KB JPEG. `astro check` 0 lỗi. DB không bị ghi.
  - Chưa kiểm tra: lưu thật + lấy poster tour với phiên admin (chế độ xem giao diện không có quyền ghi). Chưa commit/deploy.

- 18/10/2026 — **Kiểm tra lại toàn bộ + thêm CI/CD.**
  - Kiểm tra trên máy: `npm run check` 0 lỗi/0 cảnh báo (51 file); `npm run test:db` 15/15; `npm run build` OK; `wrangler deploy --dry-run` 1.587,7 KiB (gzip 377 KiB), chạy được cả khi không đăng nhập Cloudflare; `npm audit` 0 lỗ hổng; `npm ls` khớp lockfile. Dev server: `/en…` 301 đúng trang, 404 đúng; `qa:shots` 12/12; `qa-a11y` 8/8; hero 13/13 cỡ màn hình; `qa-admin` 12/12 (gồm trang sửa + xem trước Nhà Hà Phát).
  - CI/CD: `.github/workflows/ci.yml` (GitHub Actions, Node 22): `npm ci` → check → test:db → build → dry-run; deploy (`wrangler deploy`) chỉ khi push vào `main` và mọi bước pass. Secret: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (hướng dẫn trong SETUP.md mục 2). YAML đã kiểm tra bằng parser; workflow **chưa chạy trên GitHub** (chờ tạo lại repo + đặt secret).
  - Bỏ qua: lint (chưa có ESLint), QA trình duyệt trong CI (cần dev server + phiên admin) → thêm khi có test e2e chạy với Supabase riêng cho CI.

- 18–19/10/2026 — **Mở công khai repo + CI/CD chạy thật.**
  - Repo công khai: lịch sử gộp thành 1 commit sạch (bỏ email cá nhân, `references/` → `.gitignore`, giữ trên máy); xóa repo cũ trên GitHub rồi tạo lại cùng tên (commit cũ mở theo SHA → "No commit found"). Commit dùng email noreply GitHub (`git config` riêng repo). Lịch sử cũ sao lưu ngoài repo: `../portfolio-history-backup-2026-10-17.bundle` (có email, không đưa lên đâu).
  - CI lần 1: mọi bước kiểm tra pass, Deploy lỗi `Authentication error [code: 10000]` — token tạo nhầm tài khoản Cloudflare khác với tài khoản sở hữu Worker. Log công khai in email tài khoản → đã xóa lần chạy; bước Deploy giờ che email trong output (`sed`, `pipefail` vẫn báo lỗi).
  - CI lần 2 (commit `b4eba1f`, token đúng tài khoản): pass toàn bộ, deploy version `458330d1`; log không có email. Bản thật: trang 200, `/en…` 301, 404 đúng, admin → login; script sửa nút Lưu có trên trang admin.
  - Việc tiếp theo: chủ website đăng nhập admin, nhập lại link JEGA cho "Nhà Hà Phát", bấm Lưu, kiểm tra poster tour và khu "Khám phá không gian" trên trang công khai.

- 19/10/2026 — **Ảnh cho mục Giới thiệu (ảnh : chữ = 4 : 6).**
  - DB: `supabase/migrations/0004_about_image.sql` — loại media `about` (media của site như hero/logo), cột `site_settings.about_media_id` + FK `settings_about_fk` `on delete set null`. **Chưa chạy trên Supabase thật.** Không phụ thuộc thứ tự deploy: `getSettings` (`src/lib/data.ts`) tải ảnh theo id khi có, không embed qua FK mới; admin ẩn upload và báo cần chạy migration khi chưa có cột.
  - Admin (`/admin/settings`): thẻ "Ảnh mục Giới thiệu" cạnh thẻ hero — upload (một ảnh, ảnh mới thay ảnh cũ), sửa alt, xóa. `Uploader.astro`: gộp `replaceHero` thành `replaceSiteMedia` dùng cho hero và about.
  - Trang chủ (`src/views/HomePage.astro`): có ảnh → lưới `4fr : 6fr`, ảnh trái giữ nguyên tỷ lệ (aspect theo kích thước gốc), tiêu đề "Giới thiệu" + chữ bên phải; điện thoại xếp dọc ảnh trên. Không ảnh → bố cục cũ. Dữ liệu demo có ảnh mẫu (`media/demo/r2`).
  - Sửa thêm (lộ ra khi có dữ liệu liên hệ thật): mục Liên hệ tràn ngang 57px ở 768px (email dài) → `min-w-0` + `overflow-wrap:anywhere`; link điện thoại/Zalo cao 20px ở 390px → `py-3` âm (≥ 44px).
  - Kiểm tra: `npm run check` 0 lỗi; `test:db` 16/16 (thêm test 0004: `media_owner`, admin đặt `about_media_id`, xóa ảnh → null); build OK; dry-run 1.590 KiB. Demo: tỷ lệ đo được 4,0 : 6,0 ở 1440 và 768px (ảnh 496/744px), 390px xếp dọc, ảnh tải được, có alt. Dev (Supabase thật, chưa 0004): trang chủ giữ bố cục cũ, thẻ admin hiện cảnh báo chạy migration; `qa:shots` 12/12, `qa-a11y` 8/8, `qa-admin` 10/10, hero 13/13.
  - Việc tiếp theo: chủ website chạy 0004 trong SQL Editor → `/admin/settings` → "Ảnh mục Giới thiệu" → tải ảnh → nhập alt.

- 19/10/2026 — **Thẻ công trình + icon cho thông tin phụ** (chủ website yêu cầu). `src/components/ProjectCard.astro` dùng ở trang chủ (công trình tiêu biểu), `/cong-trinh`, công trình liên quan.
  - Thẻ (`.card` trong `src/styles/global.css`, token `--color-card` #fbfaf7, `--color-card-line-hover`, `--radius-card` 4px): viền mảnh, ảnh sát mép trên, chữ có đệm; hover nhích 2px + viền đậm + bóng rất mờ (tắt nhích khi reduced motion). Giữ trong giới hạn brief: bo nhỏ, không bóng dày, nền sáng. Lưới đổi sang `gap-6` đều.
  - Icon Lucide nét mảnh (`src/components/admin/Icon.astro`, thêm sofa/building-2/ruler-dimension-line/map-pin/calendar/arrow-up-right): loại hình theo danh mục (nhà ở → house, nội thất → sofa, khác → building), diện tích → thước, địa điểm → map-pin, năm → calendar (năm chuyển từ cạnh tên xuống dòng thông tin); mũi tên ↗ góc thẻ. Icon `aria-hidden`, mỗi mục có nhãn `sr-only` ("Diện tích: 200 m²").
  - Kiểm tra (dev, Supabase thật): `astro check` 0 lỗi; ảnh 1440/390px: hai thẻ cao bằng nhau, hover đúng; `qa:shots` 12/12, `qa-a11y` 8/8.

Khi thực hiện, thêm ngày, phần đã thay đổi, file liên quan, lệnh kiểm tra/kết quả, giới hạn và việc tiếp theo. Giữ trạng thái đúng với bằng chứng thực tế.
