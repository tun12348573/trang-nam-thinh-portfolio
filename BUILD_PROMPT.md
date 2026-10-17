# Prompt tạo website portfolio kiến trúc

Đặt bộ file vào thư mục gốc dự án và dùng prompt A cho lần triển khai đầu tiên. Các prompt B/C/D dùng cho những lượt làm việc sau. Tài liệu này dùng được cho Claude Code hoặc Codex; bản context là nguồn yêu cầu chung.

## A. Prompt khởi tạo dự án

```text
Bạn là frontend engineer và full-stack engineer có kinh nghiệm xây website portfolio kiến trúc có CMS. Hãy xây dựng website trong repository hiện tại theo brief, ưu tiên độ giống tham chiếu thị giác và khả năng quản trị thực tế.

ĐỌC TRƯỚC KHI THỰC HIỆN
1. AGENTS.md
2. PROJECT_CONTEXT.md
3. PROJECT_STATE.md
4. references/landing-reference.mp4 và các ảnh reference-00s.jpg, reference-02s.jpg, reference-04s.jpg trong thư mục references.

Nếu repository đã có code, đọc cấu trúc, dependency và lockfile trước. Không khởi tạo đè dự án. Nếu công cụ không xem được video, dùng các frame ảnh; nếu không xem được ảnh, báo giới hạn thay vì nói đã phân tích tham chiếu.

MỤC TIÊU
Tạo website tiếng Việt cho CÔNG TY TNHH TRANG NAM THỊNH để khách hàng xem các công trình do chúng tôi thiết kế: ảnh phối cảnh, video render, bản vẽ mặt bằng và tour 3D/360° từ JEGA. Viewer mô hình 3D không thuộc v1. Có trang quản trị để tôi tự thêm, sửa, sắp xếp và xuất bản công trình. Tên và thông tin doanh nghiệp nằm trong cấu hình, xem CONF-08 trong PROJECT_CONTEXT.md.

HƯỚNG THỊ GIÁC BẮT BUỘC
- Bám sát trang nền trắng ngà ở giữa video, bỏ qua giao diện công cụ, vùng tối, mép màn hình và taskbar bên ngoài.
- Headline sans-serif lớn nhưng nét thường, căn trái, ít dòng; header gọn; nhiều khoảng trắng.
- Công trình lớn chiếm phần giữa/dưới hero. Không thay bằng hero SaaS có chữ bên trái và ảnh nhỏ trong một thẻ bên phải.
- Tiếp theo là ba hình công trình cạnh nhau trên desktop, rồi bố cục chữ nhỏ bên trái và ảnh công trình lớn bên phải.
- Tông trắng ngà/xám tối, góc ảnh gần vuông, ít bóng đổ. Không tự thêm gradient, glassmorphism, neon, nền tối hoặc card bo tròn lớn.
- Chuyển nội dung từ giới thiệu nhà bán trong mẫu thành hồ sơ công trình thiết kế. Không có giá bán, mua/thuê hay giỏ hàng.
- Trang chi tiết và admin dùng cấu trúc mới được mô tả trong context, không tự tuyên bố chúng xuất hiện trong video.

HERO VÀ CHUYỂN ĐỘNG
Mẫu có chuyển động trong cảnh kiến trúc; chưa có bằng chứng bắt buộc dùng WebGL. Tách cấu hình image/video. Khi có video render sạch phù hợp, dùng video cùng poster, muted, playsinline và điều khiển pause. Khi chưa có asset phù hợp, dựng hero ảnh đúng bố cục, ghi rõ phần chuyển động cần bổ sung; không dùng video quay màn hình làm hero, không vẽ nhà/xe giả bằng CSS để báo là đã giống mẫu. Hỗ trợ reduced motion và fallback khi autoplay bị chặn.

CÁC TRANG VÀ CHỨC NĂNG
- /: header, hero, công trình tiêu biểu, công trình nổi bật, giới thiệu ngắn, liên hệ/footer tối giản.
- /cong-trinh: danh sách, bộ lọc theo danh mục cố định.
- /cong-trinh/[slug]: metadata, ý tưởng, gallery, video, bản vẽ zoom, tour JEGA.
- /admin/login, /admin/projects, /admin/projects/new, /admin/projects/[id], /admin/settings: đăng nhập, CRUD, upload, sắp xếp media, chọn bìa, preview riêng tư, xuất bản/gỡ xuất bản (chặn khi thiếu trường bắt buộc), cấu hình trang chủ, doanh nghiệp và liên hệ.
- Khách không cần đăng nhập. Chỉ có một vai trò admin.
- Không hiển thị mục rỗng. Mọi nút có hành vi thật hoặc được ẩn khi thiếu cấu hình.

MEDIA VÀ JEGA
1. Ảnh/video render: gallery/lightbox, tách nhóm bản vẽ để không crop mất số đo. Ảnh resize trong trình duyệt admin ra WebP 640/1280/2400 px. Video công trình là link YouTube (không công khai); video hero nằm trong public/media.
2. Tour JEGA: lưu HTTPS URL thuộc host cho phép và poster (lấy từ og:image). Iframe chỉ tạo khi khách bấm poster, luôn có nút mở ngoài. Có cờ tắt nhúng nếu iframe hiện giỏ hàng của JEGA. Không coi iframe.onload là bằng chứng tour dùng được. Không bịa API/MCP JEGA, không chèn HTML embed tùy ý.

KIẾN TRÚC ĐÃ CHỐT
Astro + TypeScript + Tailwind CSS, adapter @astrojs/cloudflare trên Cloudflare Workers Free; Supabase Free cho Postgres/Auth/Storage (bucket media-private + media-public). Không cần thẻ thanh toán. Chi tiết và giới hạn gói free ở mục 10 PROJECT_CONTEXT.md. Kiểm tra tài liệu chính thức hiện hành và khóa dependency tương thích; không trộn hướng dẫn giữa major version.

CMS phải lưu dữ liệu thật. Bảo vệ endpoint ở server cùng RLS database. Media nháp nằm ở bucket private; xuất bản chuyển ảnh sang bucket public rồi mới đổi trạng thái. Không lộ secret ở client. Không giả lập đăng nhập/CMS bằng localStorage rồi báo hoàn thành.

Nếu thiếu kết nối backend, vẫn làm các phần cục bộ đã rõ, cung cấp migration/cấu hình mẫu/hướng dẫn setup và nêu chính xác phần chưa kiểm tra. Không yêu cầu tôi gửi secret trong hội thoại và không tự tạo tài nguyên trả phí.

CÁCH TRIỂN KHAI
1. Tóm tắt ngắn những yêu cầu đã xác nhận, mặc định đề xuất và phần đang thiếu. Lập kế hoạch theo các phần có thể kiểm tra. Chỉ hỏi thông tin thật sự chặn công việc; tiếp tục các phần độc lập.
2. Dựng landing page sát mẫu trước. Chụp desktop để đối chiếu bố cục/hero/typography/ba ảnh, điều chỉnh sai khác lớn trước khi thêm hiệu ứng phụ.
3. Thêm trang danh sách và chi tiết, gallery, video và tour JEGA.
4. Triển khai CMS, auth, database, Supabase Storage và trạng thái nháp/xuất bản. Tách phong cách quản trị khỏi giao diện công khai.
5. Kiểm tra responsive 390/768/1440 px, chuyển ngôn ngữ, keyboard/reduced motion, gallery, upload, quyền truy cập và publish/unpublish.
6. Chạy typecheck/lint/build cùng kiểm thử liên quan thực sự có trong dự án. Ghi kết quả, ảnh QA, phần bị chặn và việc tiếp theo vào PROJECT_STATE.md.

TIÊU CHUẨN BÁO CÁO
Nêu phần đã làm, bằng chứng kiểm tra, phần chưa chạy được vì thiếu tài khoản/asset và vị trí cấu hình để tôi thay nội dung. Không tuyên bố pixel-perfect khi chỉ có video quay màn hình; không báo tour/model đã tích hợp thành công khi chưa thử asset thật. Không bịa công trình, số năm kinh nghiệm, số điện thoại hay lời nhận xét khách hàng.

Bắt đầu bằng việc đọc các file trên và kiểm tra repository hiện tại.
```

## B. Prompt tiếp tục bằng công cụ AI còn lại

```text
Tiếp tục dự án hiện tại. Đọc AGENTS.md, PROJECT_CONTEXT.md và PROJECT_STATE.md trước. Kiểm tra code/diff thực tế để xác minh tiến độ; không xây lại từ đầu.

Giữ những quyết định đã xác nhận, đặc biệt là độ bám sát video và cách tách ảnh/video, tour JEGA, file mô hình. Tóm tắt phần tiếp theo, rồi thực hiện hạng mục chưa xong có ưu tiên cao nhất. Chỉ hỏi khi có một thông tin thực sự chặn công việc; ghi lại kết quả và việc còn thiếu vào PROJECT_STATE.md sau khi làm.
```

## C. Prompt chỉnh giao diện khi AI làm lệch mẫu

```text
Hãy đối chiếu landing page hiện tại với references/reference-00s.jpg, reference-02s.jpg và reference-04s.jpg, đồng thời đọc mục 3–8 của PROJECT_CONTEXT.md.

Liệt kê tối đa 5 sai khác thị giác ảnh hưởng lớn nhất: tỷ lệ bố cục, vị trí/cỡ headline, kích thước công trình hero, khoảng trắng, lưới ba ảnh, màu và góc bo. Sửa lần lượt các sai khác lớn trước. Giữ nguyên hành vi và dữ liệu đang hoạt động nếu không cần thay để sửa bố cục.

Không thiết kế lại theo sở thích riêng, không thêm section hoặc hiệu ứng mới để che việc lệch mẫu. Chụp lại cùng viewport và báo phần đã khớp, phần còn phụ thuộc asset/font gốc. Ghi kết quả vào PROJECT_STATE.md.
```

## D. Prompt bổ sung một công trình thật

```text
Tôi muốn thêm công trình thật vào website. Đọc PROJECT_CONTEXT.md và cấu trúc CMS hiện tại. Kiểm kê những ảnh, video, bản vẽ và link JEGA tôi vừa cung cấp.

Video phải là link YouTube (không công khai); kiểm tra link tour bằng phiên khách. Website chỉ dùng tiếng Việt (CONF-10). Tạo công trình ở trạng thái nháp, phân nhóm media, đề xuất ảnh bìa và metadata chỉ từ thông tin tôi đưa. Trường chưa có dữ liệu thì để trống hoặc hỏi, không bịa. Không thay nội dung bản vẽ và không tự công khai file gốc.

Sau khi lưu, cho biết nội dung đã có, nội dung còn thiếu và cách xem trước công trình. Chỉ xuất bản theo chỉ dẫn của tôi.
```
