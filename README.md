# Bộ hướng dẫn tạo website portfolio kiến trúc

Bộ tài liệu dành cho website giới thiệu công trình, bám sát video tham chiếu, có nội dung JEGA/3D và trang quản trị. Dùng chung cho Claude Code và Codex. Thư mục này chứa cả bộ hướng dẫn và source code website v1 (Astro trên Cloudflare Workers); tiến độ thực tế xem `PROJECT_STATE.md`.

## Địa chỉ

- Website: https://trang-nam-thinh-portfolio.trang-nam-thinh-portfolio.workers.dev
- Quản trị: https://trang-nam-thinh-portfolio.trang-nam-thinh-portfolio.workers.dev/admin/login
- Mã nguồn: https://github.com/tun12348573/trang-nam-thinh-portfolio
- Deploy lại sau khi sửa: `npm run deploy`

## Các file

| File | Mục đích |
| --- | --- |
| `PROJECT_CONTEXT.md` | Brief chính: yêu cầu đã chốt, mô tả mẫu, quy tắc thị giác, cấu trúc trang, CMS/3D, kiến trúc đề xuất và nghiệm thu. |
| `BUILD_PROMPT.md` | Prompt khởi tạo, tiếp tục dự án, chỉnh giao diện lệch mẫu và thêm công trình thật. |
| `AGENTS.md` | Quy tắc dùng chung cho công cụ phát triển, yêu cầu đọc context và cập nhật tiến độ. |
| `CLAUDE.md` | Import quy tắc chung bằng `@AGENTS.md` cho Claude Code. |
| `PROJECT_STATE.md` | Trạng thái ban đầu và nơi ghi tiến độ để chuyển giữa hai AI. |
| `references/` | Video gốc được đổi tên gọn và ba frame để công cụ có khả năng đọc ảnh đối chiếu. |
| `SETUP.md` | Kết nối Supabase (database, đăng nhập, lưu ảnh), tài khoản admin và deploy lên Cloudflare Workers. |

## Lệnh

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Chạy local tại http://localhost:4321 (dữ liệu minh họa nếu chưa cấu hình Supabase) |
| `npm run check` | Typecheck |
| `npm run test:db` | Kiểm thử migration + RLS bằng PGlite |
| `npm run qa:shots -- <url> <đường dẫn…>` | Chụp ảnh QA 390/768/1440 px vào `qa/`, báo tràn ngang |
| `node scripts/qa-a11y.mjs <url> <đường dẫn…>` | Rà soát vùng bấm ≥ 44px, chữ ≥ 12px, alt, tràn ngang |
| `node scripts/load-test.mjs <url> [tổng] [đồng thời]` | Thử tải nhẹ, báo mã lỗi và độ trễ |
| `node scripts/qa-admin.mjs <url> <đường dẫn…>` | Chụp + rà soát trang admin (cần `ADMIN_DESIGN_PREVIEW=1` trong `.dev.vars` khi dev) |
| `npm run deploy` | Build và deploy lên Cloudflare Workers |

## Cách sử dụng

1. Giải nén bộ tài liệu vào một thư mục dự án mới. Nếu dùng dự án có sẵn, đưa các file vào thư mục gốc; với `AGENTS.md`/`CLAUDE.md` đang tồn tại, hợp nhất nội dung phù hợp thay vì ghi đè.
2. Mở thư mục đó bằng VS Code, chạy Claude Code hoặc Codex trong đúng repository.
3. Dán phần trong khối prompt A của `BUILD_PROMPT.md` vào công cụ bạn chọn.
4. Để công cụ đọc context, tham chiếu và repository rồi triển khai phần đã rõ. Bổ sung asset/tài khoản cho những phần cần kết nối thực tế.
5. Khi đổi công cụ, dùng prompt B để tiếp tục từ `PROJECT_STATE.md`. Mỗi lượt nên có một công cụ chịu trách nhiệm sửa code; công cụ còn lại có thể đọc/review sau khi có trạng thái ổn định.
6. Khi giao diện lệch mẫu, dùng prompt C thay cho một yêu cầu chung chung như “làm đẹp hơn”.

Codex hỗ trợ quy tắc theo `AGENTS.md`; Claude Code hỗ trợ `CLAUDE.md` và import file. Cấu hình cấp máy/tổ chức có thể ảnh hưởng cách đọc hướng dẫn, nên ở phiên đầu hãy yêu cầu công cụ tóm tắt các yêu cầu chính để kiểm tra nó đã đọc đúng brief.

## Những điểm đã chốt

- Bám sát bố cục, màu sắc, kiểu chữ và chuyển động trong video.
- CÔNG TY TNHH TRANG NAM THỊNH; chỉ tiếng Việt (bỏ bản tiếng Anh ngày 17/10/2026, link `/en` cũ chuyển 301).
- Khách xem công trình qua ảnh/video, bản vẽ và tour JEGA. Viewer 3D để sau v1.
- Chủ website tự cập nhật qua trang quản trị có lưu dữ liệu thật; một vai trò admin.
- Chi phí 0, không cần thẻ: Astro trên Cloudflare Workers, Supabase Free cho DB/Auth/ảnh, video công trình qua YouTube (không công khai).
- Liên hệ qua kênh đã cấu hình; không có form.
- Danh sách đầy đủ: `PROJECT_CONTEXT.md` mục 2.

Các trang ngoài phần video quay được là phần mở rộng đề xuất, không được xem là bản sao đã quan sát đầy đủ.

## Bổ sung để hoàn thiện

Ảnh/video hero sạch, nội dung của một công trình thật, logo, mã số thuế, địa chỉ và kênh liên hệ. Có thể dựng bố cục trước, nhưng không gọi bản dùng dữ liệu minh họa là portfolio đã sẵn sàng công khai.

## Tài liệu chính thức

- [Codex — AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude Code — project instructions và import](https://code.claude.com/docs/en/memory)
- Các nguồn JEGA, Astro, Cloudflare và Supabase nằm ở cuối `PROJECT_CONTEXT.md`.
