# Quy tắc làm việc chung — portfolio kiến trúc

## Đọc trước khi thay đổi

Đọc toàn bộ `PROJECT_CONTEXT.md` và `PROJECT_STATE.md` ở thư mục gốc trước khi viết hoặc sửa code. Nếu một file chưa có, báo thiếu và dùng phần thông tin đã được cung cấp; không tự nhận đã đọc.

`PROJECT_CONTEXT.md` là brief về sản phẩm, thị giác và kiến trúc đề xuất. `PROJECT_STATE.md` ghi tiến độ thực tế và việc tiếp theo. Hai file phục vụ Claude Code và Codex, tránh mỗi công cụ tự chọn một hướng khác nhau.

## Giữ hướng thiết kế

- Landing page bám sát video và frame trong `references/`.
- Giữ nền trắng ngà, headline sans-serif nét thường, công trình hero lớn, khoảng trắng và nhịp ba ảnh trên desktop.
- Chỉ xem phần trang nền sáng ở giữa video là mẫu; không dựng lại giao diện công cụ hoặc taskbar bao quanh.
- Trang công khai trình bày công trình kiến trúc; không biến thành giao diện bán bất động sản hoặc SaaS.
- Phân biệt ảnh/video render, tour JEGA và mô hình tương tác. Chỉ báo hỗ trợ định dạng/nhúng sau khi đã kiểm tra.
- Thông tin/asset chưa có phải ghi rõ. Không bịa thương hiệu, công trình, kinh nghiệm, liên hệ hoặc kết quả kiểm thử.

## Triển khai

- Đọc repo và lockfile trước; giữ công nghệ đang dùng nếu phù hợp.
- Tập trung design tokens để hiệu chỉnh, không rải màu/khoảng cách tùy ý khắp code.
- CMS phải có lưu trữ thật, phân quyền server/database/storage và nháp tách khỏi bản xuất bản.
- Không đưa secret/service role key vào client, Git hoặc file hướng dẫn.
- Thực hiện phần đã rõ, chỉ hỏi điều thật sự chặn công việc. Không đổi phạm vi hoặc kiến trúc lớn bằng suy đoán.

## Kiểm tra và bàn giao

- Chạy các lệnh kiểm tra thực sự được dự án cấu hình; ghi lệnh và kết quả. Không bịa script hoặc báo pass khi chưa chạy.
- Đối chiếu ảnh desktop với tham chiếu; kiểm tra thêm mobile, luồng upload/xuất bản và quyền truy cập.
- Sau mỗi đợt thay đổi, cập nhật `PROJECT_STATE.md`: phần đã làm, file liên quan, kiểm tra, giới hạn và việc tiếp theo.
- Đọc chỉ dẫn mới nhất của người dùng; khi họ đổi một quyết định, cập nhật context rõ ràng và giữ phần khác nhất quán.
- Khi chuyển công cụ AI, xác minh trạng thái code hiện tại trước khi tiếp tục. Tránh đồng thời sửa cùng file từ hai phiên làm việc.
