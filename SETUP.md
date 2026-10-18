# SETUP — Kết nối Supabase và deploy

Website chạy được ở chế độ **dữ liệu minh họa** khi `SUPABASE_URL` để trống. Dữ liệu thật, ảnh và trang quản trị dùng **Supabase** (database, đăng nhập, lưu ảnh). Website chạy trên **Cloudflare Workers**. Cả hai đều dùng gói miễn phí và **không cần thẻ thanh toán**.

Không gửi mật khẩu hay secret vào hội thoại với AI. Website này không cần secret nào: URL và publishable key của Supabase là công khai, dữ liệu được RLS bảo vệ.

## 1. Supabase

1. Tạo project tại <https://supabase.com/dashboard>, region **Southeast Asia (Singapore)**. Bỏ chọn "Automatically expose new tables".
2. **SQL Editor**: mở file, copy **nội dung** (không phải đường dẫn), dán vào, bấm Run. Mỗi file chạy **một lần**, theo thứ tự:
   1. `supabase/migrations/0001_init.sql`: bảng, RLS.
   2. `supabase/migrations/0002_supabase_storage.sql`: bucket ảnh `media-private`/`media-public`, quyền storage, link video YouTube.
   3. `supabase/migrations/0003_drop_english.sql`: bỏ bản tiếng Anh — **xóa vĩnh viễn** các cột `_en`. Project đang chạy code cũ: deploy code mới (mục 2) **trước**, rồi mới chạy file này; chạy ngược thứ tự thì admin bản cũ lưu sẽ lỗi.
3. **Authentication → Users → Add user**: email + mật khẩu admin, tích "Auto confirm User".
4. Copy **User UID**, chạy riêng trong SQL Editor:
   ```sql
   insert into public.admin_users (user_id) values ('<USER UID>');
   ```
5. **Authentication → Sign In / Providers**: tắt **Allow new users to sign up**.
6. Điền vào `wrangler.jsonc` → `vars`:
   - `SUPABASE_URL`: `https://<project-ref>.supabase.co` (project ref nằm trên thanh địa chỉ dashboard).
   - `SUPABASE_ANON_KEY`: **Settings → API Keys → Publishable key** (`sb_publishable_…`). Không dùng secret key.

Kiểm tra: `npm run dev` → <http://localhost:4321/admin/login> → đăng nhập → thấy trang "Công trình".

### Giới hạn Supabase Free

| | Giới hạn | Ảnh hưởng |
| --- | --- | --- |
| Lưu trữ file | 1 GB | Ảnh WebP ~100–300 KB/tấm → vài nghìn ảnh |
| Mỗi file | 25 MB (đặt ở bucket) | Ảnh đã resize trong trình duyệt, không chạm giới hạn |
| Băng thông tải xuống | 5 GB/tháng | Đủ cho portfolio; xem mức dùng ở **Settings → Usage** |
| Tạm dừng | sau 7 ngày không hoạt động | Cron của Worker ping hằng ngày để tránh |

**Video**: video render công trình đăng lên YouTube ở chế độ **Không công khai (Unlisted)**, dán link vào trang sửa công trình. Video hero mặc định nằm trong mã nguồn (`public/media/hero.mp4`). Không video nào lưu trên Supabase.

## 2. Cloudflare Workers (deploy)

```sh
npx wrangler login     # mở trình duyệt, đăng nhập / tạo tài khoản Cloudflare miễn phí, bấm Allow
npm run check          # typecheck
npm run test:db        # kiểm thử migration + RLS (PGlite)
npm run deploy         # astro build && wrangler deploy
```

Website chạy tại `https://trang-nam-thinh-portfolio.<tài-khoản>.workers.dev`. Admin tại `/admin/login`.

- Cron Trigger (03:00 UTC hằng ngày) tự ping Supabase.

### Deploy tự động (CI/CD, GitHub Actions)

`.github/workflows/ci.yml` chạy với mọi push/PR: `npm ci` → `npm run check` → `npm run test:db` → `npm run build` → `wrangler deploy --dry-run`. Chỉ khi **push vào `main`** và mọi bước pass mới chạy `wrangler deploy`. PR chỉ kiểm tra, không deploy.

Cài một lần (repo GitHub → Settings → Secrets and variables → Actions):

1. `CLOUDFLARE_API_TOKEN`: Cloudflare Dashboard → My Profile → API Tokens → Create Token → mẫu **Edit Cloudflare Workers** → chọn đúng tài khoản → Create. Token chỉ hiện một lần; dán thẳng vào GitHub, không lưu vào file hay gửi qua chat.
2. `CLOUDFLARE_ACCOUNT_ID`: lấy bằng `npx wrangler whoami`.

Bằng `gh`: `gh secret set CLOUDFLARE_API_TOKEN` (dán token khi được hỏi) và `gh secret set CLOUDFLARE_ACCOUNT_ID --body <id>`.

Migration Supabase **không** chạy trong CI (CI không giữ quyền ghi database): vẫn chạy tay trong SQL Editor, theo thứ tự ghi trong file migration.
- **Cloudflare Web Analytics**: Dashboard → Analytics & Logs → Web Analytics → thêm site (miễn phí, không cookie).

## 3. Trước khi công khai (cần tên miền)

1. Mua tên miền, chuyển nameserver về Cloudflare (gói Free).
2. Workers → `trang-nam-thinh-portfolio` → Settings → Domains & Routes → thêm tên miền.
3. Cache 60 giây của trang công khai chỉ chạy trên custom domain (không chạy trên `workers.dev`).

## Giới hạn cần biết

- Admin nên dùng **Chrome/Edge**: Safari không mã hóa WebP bằng canvas, ảnh sẽ lưu thành PNG (nặng hơn).
- Xuất bản/gỡ xuất bản/xóa công trình: trình duyệt admin chuyển hoặc xóa từng ảnh trên Supabase Storage. **Giữ trang mở tới khi thấy thông báo xong.** Nếu bị ngắt giữa chừng, bấm lại nút; thao tác chạy lại an toàn.
- Gỡ xuất bản: trang công trình biến mất ngay; ảnh được chuyển về bucket private ngay sau đó.
