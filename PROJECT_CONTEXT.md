# PROJECT_CONTEXT — Website portfolio kiến trúc

Phiên bản: 1.2 · Ngày: 17/10/2026 · 1.1 (15/10) chốt quyết định qua grilling; 1.2 bỏ bản tiếng Anh (CONF-10).

Đây là bản brief dùng chung cho Claude Code và Codex. Tài liệu ghi lại yêu cầu đã xác nhận và các mặc định được đề xuất; website chưa được triển khai. Các mặc định có thể thay đổi khi chủ website cung cấp thêm thông tin. Không được biến một giả định thành yêu cầu đã được người dùng xác nhận.

## 1. Mục tiêu và người sử dụng

Xây dựng website để khách hàng xem những công trình do doanh nghiệp thiết kế: phối cảnh, video render, bản vẽ mặt bằng và tour JEGA. Mô hình 3D tải về chưa thuộc v1. Giao diện mở đầu phải bám sát mẫu trong video đính kèm. Chủ website tự cập nhật nội dung qua trang quản trị.

Luồng chính: vào trang chủ → khám phá công trình → xem hồ sơ thiết kế và trải nghiệm không gian → sử dụng kênh liên hệ đã cấu hình.

Khách xem công trình công khai không cần tài khoản và không có tài khoản khách. Trang quản trị chỉ dành cho tài khoản admin.

## 2. Quyết định đã được người dùng xác nhận

| ID | Quyết định |
| --- | --- |
| CONF-01 | Đây là website trưng bày các công trình do doanh nghiệp thiết kế. |
| CONF-02 | Landing page bám sát bố cục, màu sắc, kiểu chữ và chuyển động trong video tham chiếu. |
| CONF-03 | Người dùng có thể cung cấp ảnh phối cảnh và video render từ JEGA. |
| CONF-04 | Người dùng có thể cung cấp link xem 3D/360° từ JEGA. |
| CONF-05 | Người dùng có thể cung cấp file mô hình 3D tải về; chưa biết định dạng. **Viewer 3D và schema model không thuộc v1.** |
| CONF-06 | Có trang quản trị để tự tải nội dung và sửa thông tin công trình. |
| CONF-07 | Dùng Claude Code và Codex để phát triển. |
| CONF-08 | Pháp nhân: **CÔNG TY TNHH TRANG NAM THỊNH**. Tên ngắn ở header: **Trang Nam Thịnh**. |
| CONF-09 | Website đại diện doanh nghiệp: xưng "chúng tôi", structured data `Organization`. |
| CONF-10 | **Chỉ tiếng Việt** (chủ website đổi ngày 17/10/2026; trước đó song ngữ Việt/Anh). Không có `/en`, nút chuyển ngôn ngữ hay `hreflang`. Link `/en` cũ chuyển 301 sang trang tiếng Việt tương ứng. Cột `_en` trong database đã xóa hẳn (migration 0003), nội dung tiếng Anh đã nhập không giữ lại. Xuất bản cần tên, mô tả một dòng và ý tưởng thiết kế. |
| CONF-11 | Nháp/xuất bản dùng cờ trạng thái `draft`/`published`, không có bảng revision. Sửa công trình đã xuất bản thì thay đổi hiện công khai ngay. |
| CONF-12 | Chi phí vận hành 0, **không cần thẻ thanh toán**: Cloudflare Workers Free (chỉ chạy website) + Supabase Free (database, đăng nhập, lưu ảnh). Giai đoạn dev dùng `*.workers.dev`; mua tên miền trước khi công khai. (15/10/2026: bỏ Cloudflare R2 vì R2 bắt buộc thêm phương thức thanh toán.) |
| CONF-13 | Framework: Astro + `@astrojs/cloudflare`. |
| CONF-14 | Ảnh và bản vẽ lưu ở Supabase Storage (bucket `media-private` / `media-public`). Video render công trình đăng YouTube chế độ **Không công khai**, website chỉ lưu link (`projects.video_urls`). Video hero nằm trong mã nguồn (`public/media`). Không video nào lưu trên Supabase (băng thông Free 5 GB/tháng). |
| CONF-15 | Không upload file video qua admin. Video công trình: link YouTube (tối đa 12/công trình). Đổi video hero: thay `public/media/hero.mp4` (≤ 15 MB, H.264) và deploy lại. |
| CONF-16 | Ảnh được resize trong trình duyệt admin khi upload (WebP 640/1280/2400 px); bản vẽ giữ thêm file gốc để zoom. |
| CONF-17 | Media của công trình đã xuất bản là public; media nháp là private. Bản vẽ nhạy cảm không upload hoặc che trước khi upload. |
| CONF-18 | Chỉ có một vai trò admin. Tài khoản admin tạo thủ công trên Supabase; không có giao diện mời, không có tài khoản khách. |
| CONF-19 | Tour JEGA: iframe chỉ tải khi khách bấm poster, kèm nút "Mở tour JEGA". Nếu không tắt được giỏ hàng/nút mua của JEGA trong iframe thì chuyển sang chỉ dùng link ngoài. |
| CONF-20 | Không có form liên hệ; chỉ link Zalo / `tel:` / email đã cấu hình. |
| CONF-21 | Danh mục công trình cố định trong code: Nhà ở / Nội thất / Công trình khác (Residential / Interior / Other). |
| CONF-22 | Trang công khai cache tối đa 60 giây; không gọi purge API khi xuất bản. |
| CONF-23 | Thống kê truy cập dùng Cloudflare Web Analytics (không cookie, không cần banner). |
| CONF-24 | Cron Trigger của Cloudflare ping Supabase hằng ngày để project Free không bị tạm dừng. |
| CONF-25 | Hero mặc định là clip render do chủ website cung cấp (15/10/2026): biệt thự hiện đại, trời trắng, xe chạy vào sân, 1912×1080, 10 giây, H.264, 7,97 MB. Đóng gói tại `public/media/hero.mp4` (không hotlink nguồn CloudFront). Chạy một lần rồi dừng ở khung cuối. Hero upload qua admin sẽ thay bản mặc định. Không dùng ảnh render nội thất JEGA làm hero. **Chủ website xác nhận clip chỉ là hình minh họa**, không phải công trình của công ty: không đưa vào danh sách công trình, không gắn tên, địa điểm hay mô tả như một dự án đã thiết kế. |

## 3. Bằng chứng thị giác và giới hạn của mẫu

Thư mục `references/` chỉ có trên máy của chủ website, không đưa lên repo công khai (ảnh chụp màn hình có thông tin cá nhân và thiết kế của bên khác). Bản clone không có thư mục này thì dùng mô tả thị giác bên dưới.

Nguồn: `references/landing-reference.mp4`, dài khoảng 5,17 giây, khung hình 720 × 1280. Đây là video quay màn hình có website nằm bên trong, không phải bản thiết kế mobile có chiều rộng 720 px.

Các khung hình hỗ trợ quan sát:

- `references/reference-00s.jpg`
- `references/reference-02s.jpg`
- `references/reference-04s.jpg`

Chỉ dùng trang nền sáng ở giữa làm tham chiếu. Bỏ qua thanh giao diện của công cụ bên ngoài, vùng tối xung quanh, mép màn hình và taskbar Windows. Không dùng video quay màn hình làm video hero trên sản phẩm.

### Quan sát được

- Nền trắng ngà, chữ xám/đen có sắc độ dịu; tổng thể sáng và thoáng.
- Header nhỏ, ít thành phần; phần chữ nhỏ tương phản với headline lớn.
- Headline sans-serif, nét thường, căn trái, xuống dòng ngắn.
- Khối biệt thự hiện đại chiếm phần lớn phần giữa và dưới hero; công trình là tâm điểm thị giác.
- Có xe di chuyển trong cảnh hero. Mẫu cho thấy chuyển động của cảnh; không chứng minh cảnh được dựng bằng WebGL.
- Sau hero là tiêu đề nhỏ hơn và ba ô hình công trình đặt cạnh nhau.
- Bên dưới bắt đầu một bố cục có chữ nhỏ bên trái và ảnh công trình lớn bên phải.
- Các ô ảnh thiên về hình chữ nhật, góc vuông hoặc bo rất ít, ít hiệu ứng bóng.

### Chưa thể kết luận từ video

- Font gốc, mã màu gốc, kích thước CSS và breakpoint thực tế.
- Công nghệ tạo hero, chiều sâu 3D thật, khả năng xoay bằng chuột hoặc phản hồi khi hover.
- Toàn bộ footer, menu mở rộng, trang chi tiết và các phần ngoài khung hình.
- Chuyển động theo cuộn trang, hiệu ứng sticky hoặc các tương tác không xuất hiện trong video.

Không mô tả các chi tiết chưa thấy là tính năng của mẫu. Các phần bổ sung phía dưới là đề xuất cho portfolio, không phải bản sao đã được quan sát đầy đủ. Khả năng giống mẫu tuyệt đối còn phụ thuộc asset gốc và ảnh chụp rõ hơn.

## 4. Nguyên tắc giữ hướng thiết kế

Ưu tiên theo thứ tự: hình khối và tỷ lệ bố cục → vị trí headline và công trình hero → kích thước/cách cắt ảnh → typography và khoảng trắng → màu sắc → chuyển động → chi tiết phụ.

- Giữ nền sáng, bố cục thoáng, chữ ít và hình kiến trúc lớn.
- Hero cần có công trình thật/asset phối cảnh phù hợp; một ảnh nội thất nhỏ trong thẻ không thay thế được bố cục mẫu.
- Giữ nhịp ba ảnh ở khu công trình tiêu biểu trên desktop và bố cục chữ nhỏ kết hợp ảnh lớn ở phần tiếp theo.
- Không tự chuyển sang nền tối, gradient rực, neon, glassmorphism, các thẻ bo tròn lớn, bóng dày hoặc headline cực đậm.
- Không chuyển landing page thành dashboard, trang bán bất động sản, sàn đăng tin hoặc landing SaaS.
- Không thêm giá bán, giỏ hàng, thanh toán, bộ lọc mua/thuê hoặc dữ liệu bất động sản thương mại.
- Giao diện website có phong cách tối giản hiện đại; phong cách từng công trình do nội dung thật quyết định. Không ép công trình tân cổ điển thành hiện đại để khớp giao diện.
- Thay ảnh công trình phải giữ bố cục chung, không sửa thiết kế kiến trúc hoặc tỷ lệ bản vẽ do chủ website cung cấp.

## 5. Design tokens đề xuất để bắt đầu

Các giá trị dưới đây là ước lượng thiết kế, không phải thông số đo được từ website gốc. Tập trung chúng trong một nơi để hiệu chỉnh sau khi đối chiếu ảnh.

| Token | Giá trị khởi điểm |
| --- | --- |
| Canvas | `#F4F3ED` |
| Primary text | `#30342F` |
| Secondary text | `#747970` |
| Divider | `#DDDCD5` |
| Button | `#303A32`, chữ sáng |
| Font | Inter, hỗ trợ dấu tiếng Việt; thay font khi có bằng chứng gần mẫu hơn |
| Hero headline desktop | Khoảng 56–88 px, weight 400, line-height 1.05–1.12, tracking hơi âm |
| Body | 14–16 px, line-height 1.5–1.7 |
| Content width | Khoảng 1200–1440 px tùy viewport |
| Desktop gutter | Khoảng 48–80 px; điều chỉnh theo ảnh đối chiếu |
| Section spacing | Khoảng 96–140 px desktop, 56–80 px mobile |
| Image corners | 0–4 px |

Không thêm màu nhấn nổi khi chưa có yêu cầu thương hiệu. Tách màu nền/chữ khỏi màu sắc tự nhiên của ảnh kiến trúc.

## 6. Nội dung và các trang công khai

Chỉ tiếng Việt (CONF-10). Giọng doanh nghiệp, xưng "chúng tôi". Giữ câu ngắn, rõ, ít mỹ từ. Không bịa số năm kinh nghiệm, giải thưởng, khách hàng, số lượng công trình, nhận xét hoặc chứng chỉ.

### Định tuyến

| Trang | Đường dẫn | Link cũ chuyển 301 |
| --- | --- | --- |
| Trang chủ | `/` | `/en` (và mọi `/en/...` khác) |
| Danh sách | `/cong-trinh` | `/en/projects` |
| Chi tiết | `/cong-trinh/[slug]` | `/en/projects/[slug]` |

- Slug ASCII.
- `lang="vi"` trên mọi trang.
- Văn bản giao diện (nhãn, nút) nằm trong `src/lib/text.ts`; nội dung công trình và cài đặt lưu trường `_vi` trong database (giữ hậu tố `_vi` để không phải đổi tên cột trên DB thật).

### Trang chủ `/`

1. Header: "Trang Nam Thịnh", Công trình, Giới thiệu, Liên hệ. Header nhẹ, không chiếm sự chú ý của hero.
2. Hero: headline ngắn ở phía trên bên trái, công trình lớn ở phần giữa/dưới, nút khám phá công trình màu tối. Headline nháp: “Kiến tạo không gian / mang dấu ấn riêng.” Có thể sửa câu để khớp số dòng của mẫu.
3. Công trình tiêu biểu: ba công trình trên desktop, ảnh lớn, tên và một dòng thông tin kiến trúc. Không có giá bán.
4. Công trình nổi bật: phần chữ nhỏ bên trái, hình lớn bên phải, nối tiếp nhịp thị giác đã thấy ở cuối video.
5. Giới thiệu/dịch vụ ngắn và liên hệ: phần mở rộng được đề xuất, dùng cùng hệ chữ và khoảng trắng; không tuyên bố đã thấy trong video.
6. Footer tối giản: tên pháp lý theo ngôn ngữ, mã số thuế, địa chỉ, kênh liên hệ, logo. Các trường đều cấu hình được và ẩn khi để trống.

### Danh sách `/cong-trinh`

- Lưới ảnh công trình, bộ lọc theo danh mục cố định (CONF-21) khi đã có dữ liệu thật; bộ lọc gọn, không lấn át hình.
- Chỉ hiển thị công trình đã xuất bản. Có trạng thái danh sách trống rõ ràng.

### Chi tiết `/cong-trinh/[slug]`

- Tên công trình và ảnh đại diện lớn.
- Thông tin có dữ liệu: loại hình, địa điểm ở mức được phép công khai, diện tích kèm đơn vị, năm, phong cách, vai trò thiết kế.
- Ý tưởng thiết kế ngắn, gallery ảnh theo nhóm, video render.
- Khu bản vẽ: ảnh mặt bằng/mặt đứng có zoom và xem toàn màn hình; PDF chỉ khi được cung cấp.
- Khu “Khám phá không gian”: tour JEGA (mục 7).
- Công trình liên quan và kênh liên hệ có dữ liệu thật.
- Các mục không có nội dung được ẩn; không để tab rỗng hay nút chết.

Trang Giới thiệu/Liên hệ riêng chưa bắt buộc; mặc định dùng section trên trang chủ để giữ phạm vi gọn.

## 7. Các loại media: không đánh đồng

| Loại | Cách khách xem | Quy tắc |
| --- | --- | --- |
| Ảnh/video render | Gallery, lightbox; video YouTube (tải iframe khi bấm, youtube-nocookie) | Là nội dung đã render; không gọi là mô hình xoay tự do. |
| Tour JEGA | Iframe tải khi bấm + link ngoài | Tour do JEGA phục vụ; không giả định có API/MCP. |
| File mô hình 3D | Không thuộc v1 | Xem mục "File mô hình 3D" bên dưới. |

### Tour JEGA

Kiểm tra ngày 15/10/2026 với link mẫu `https://www.jegaai.com/720/QQO202610100000000000001151671622`:

- HTTP 200 khi chưa đăng nhập. Không có header `X-Frame-Options` hoặc CSP `frame-ancestors`.
- Không tìm thấy code chặn nhúng trong bundle JS; tour gửi `postMessage` lên trang cha, tức là được thiết kế để nhúng.
- Trang có `og:image` 1200×630, dùng được làm poster.
- Cấu hình tour có `shopcar: true` và hiện logo JEGA.
- Thử trong Chromium (Playwright, phiên khách) ngày 15/10/2026: iframe tải và render panorama được. Trong iframe có logo JEGA, tên tác giả, các nút Room / VR / **Replace product** (biểu tượng túi mua hàng) / Share và nút nhạc. "Replace product" là phần cần xem có tắt được trong tài khoản JEGA không (CONF-19).

Quy tắc:

- Lưu URL chia sẻ và poster. Poster lấy từ `og:image` lúc admin nhập link, sau đó lưu bản sao lên Supabase Storage; admin có thể thay bằng ảnh khác.
- Khách thấy poster trước; iframe chỉ được tạo khi khách bấm. Luôn có nút “Mở tour JEGA” mở tab mới.
- Nếu iframe hiện giỏ hàng/nút mua mà không tắt được trong tài khoản JEGA, tắt chế độ nhúng (cờ cấu hình chung) và chỉ dùng link ngoài.
- `iframe.onload` không đủ để kết luận tour đang sử dụng được. Không giả định có thể đọc DOM iframe khác origin.
- Chỉ nhận HTTPS URL thuộc host cho phép (`www.jegaai.com`, `720.3vjia.com`; mở rộng khi gặp host thật khác). Không lưu chuỗi HTML embed tùy ý rồi chèn vào trang.
- Không xây tính năng chỉnh sửa mô hình JEGA bên trong website.

### File mô hình 3D

Không thuộc v1: chưa có file và chưa biết định dạng. Khi có file thật, bổ sung theo hướng `<model-viewer>` cho GLB, nạp khi khách chọn xem, có poster và fallback. Không hứa SKP/FBX/MAX/OBJ xem trực tiếp; glTF có tài nguyên rời cần pipeline riêng hoặc chuyển sang GLB.

### Bản vẽ

- Hiển thị đúng tỷ lệ gốc, dùng `contain` khi cần đọc đầy đủ; không crop mất kích thước như ảnh thumbnail.
- Không tự sửa số đo hoặc tái dựng công trình từ bản vẽ bằng suy đoán.
- DWG chưa thuộc v1; dùng ảnh/PDF đã xuất.

## 8. Chuyển động và hero

Mục tiêu là chuyển động nhẹ trong cảnh kiến trúc, bám tinh thần video, không biến trang thành màn trình diễn hiệu ứng.

- Tách hero asset thành chế độ `image` hoặc `video`; mô hình hero tương tác không thuộc v1.
- Video render sạch, tĩnh camera hoặc chuyển động phù hợp là lựa chọn thực tế để tái hiện cảnh có xe chuyển động. Đây là đề xuất triển khai, không phải kết luận về công nghệ của mẫu.
- Video hero tối đa 15 MB, dùng poster, muted và playsinline. Nếu tự chạy quá 5 giây, có nút tạm dừng/chạy lại gọn và dùng được bằng bàn phím.
- Khi autoplay bị chặn hoặc người dùng bật reduced motion, hiện poster có bố cục hoàn chỉnh.
- Chỉ dùng lớp xe chuyển động khi có asset tương ứng; không đặt icon xe/CSS car lên ảnh để giả giống mẫu.
- Đã có video hero (CONF-25). Từ 1024 px trở lên: video **phủ hết chiều ngang và hiện trọn ngay khi vào trang** (hero cao = màn hình − menu, tối đa 16:9). Headline tự co theo khoảng trời còn trống: màn hình đủ cao → chữ lớn trên mái nhà như mẫu; màn hình thấp/zoom lớn → chữ nhỏ gọn ở góc trên trái, trong cột trời bên trái nhà (chủ website chọn ngày 16/10/2026; đã thử và loại: cắt đáy video, video hẹp lại canh phải). Điện thoại: giữ khung 4:5, canh ngang 45% — khung chỉ hiện ~45% chiều ngang video nên không thấy trọn nhà; ưu tiên thấy trọn xe đỗ, cửa chính và nửa trái nhà (chủ website chọn giữ 4:5 ngày 17/10/2026).
- Trời trắng của render được hòa vào màu nền ngà bằng `mix-blend-multiply`. Một lớp trắng mờ dần phủ 42% phía trên để che vệt nhiễu trong vùng trời của clip. Hero mới nên có trời sáng/trắng thì mới hòa được như vậy.
- Hover ảnh có thể scale khoảng 1.02–1.03, thời gian 350–500 ms. Reveal nội dung chỉ dịch chuyển nhẹ, không làm chữ biến mất lâu.
- Không scroll hijacking, không ép cuộn ngang hoặc dùng custom cursor che nội dung. Giảm/tắt chuyển động khi `prefers-reduced-motion` yêu cầu.

## 9. Trang quản trị

Các đường dẫn: `/admin/login`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`, `/admin/settings`. Giao diện admin dùng tiếng Việt.

Quản trị cần chức năng thực, không chỉ giao diện minh họa:

- Đăng nhập, đăng xuất; chỉ tài khoản có trong `admin_users` mới có quyền sửa.
- Tạo/sửa công trình; slug duy nhất; metadata; mô tả; chọn ảnh bìa.
- Tải nhiều ảnh, sắp xếp thứ tự; phân nhóm Phối cảnh, Ảnh thực tế, Bản vẽ khi có; sửa alt text, caption và điểm cắt thumbnail.
- Ảnh được resize trong trình duyệt trước khi upload (CONF-16).
- Nhập link YouTube của video render, mỗi dòng một link; server kiểm tra đúng định dạng link YouTube (CONF-15).
- Nhập link tour JEGA; kiểm tra host; lấy poster.
- Xem trước riêng tư, xuất bản, gỡ xuất bản; chọn công trình nổi bật và thứ tự trên trang chủ.
- Xuất bản bị chặn nếu thiếu trường bắt buộc (tên, mô tả một dòng, ý tưởng, ít nhất một ảnh phối cảnh/ảnh thực tế); admin thấy danh sách trường còn thiếu khi bấm xuất bản.
- Sửa nội dung hero, hero media, phần giới thiệu, thông tin doanh nghiệp (tên pháp lý, mã số thuế, địa chỉ, logo) và kênh liên hệ.
- Giao diện quản trị gọn, dễ dùng. Không mang phong cách dashboard của admin sang landing page.

Nháp/xuất bản theo CONF-11: công trình có trạng thái `draft` hoặc `published`. Sửa công trình đang `published` thì thay đổi hiện công khai sau tối đa 60 giây (CONF-22). Muốn sửa lớn mà không lộ dở dang thì gỡ xuất bản trước. Gỡ xuất bản chặn trang chi tiết và chuyển media về private.

V1 không cần tài khoản khách hàng, nhiều vai trò, giao diện mời thành viên, đăng ký công khai, page builder, billing, chat AI, CRM hoặc workflow duyệt.

## 10. Kiến trúc kỹ thuật

Đã chốt với người dùng (CONF-12, 13, 14). Chọn phiên bản ổn định tại thời điểm triển khai, kiểm tra tài liệu chính thức, khóa phiên bản qua lockfile.

| Phần | Lựa chọn |
| --- | --- |
| Ứng dụng | Astro + TypeScript, adapter `@astrojs/cloudflare`, chạy trên Cloudflare Workers Free |
| Ngôn ngữ | Chỉ tiếng Việt (CONF-10); không dùng i18n routing; `/en` cũ chuyển 301 trong middleware |
| Styling | Tailwind CSS + design tokens tập trung; component công khai tự thiết kế theo mẫu |
| Tương tác phía client | Island nhỏ cho gallery/lightbox, video, tour JEGA, form admin |
| Database / auth | Supabase Free: Postgres + Auth (`@supabase/ssr`) |
| Media | Supabase Storage; trình duyệt admin upload/chuyển/xóa file bằng phiên đăng nhập (RLS `storage.objects` chỉ cho admin) |
| Cache | `Cache-Control` với `s-maxage=60` cho trang công khai; không purge |
| Giữ Supabase hoạt động | Cron Trigger hằng ngày gọi một truy vấn nhẹ |
| Thống kê | Cloudflare Web Analytics |
| Animation | CSS trước; thêm thư viện nhỏ chỉ khi thực sự cần |
| Kiểm thử luồng chính | Playwright nếu môi trường hỗ trợ; test RLS/quyền cho CMS |

### Giới hạn gói free cần tôn trọng

Tra cứu ngày 15/10/2026, kiểm tra lại khi triển khai:

- Workers Free: 100.000 request/ngày, **10 ms CPU mỗi request** (thời gian chờ I/O không tính), 5 Cron Triggers, 50 subrequest. Giữ trang công khai nhẹ, dựa vào cache.
- Kích thước Worker: 64 MiB trên mọi gói (từ 04/09/2026).
- Supabase Storage Free: 1 GB lưu trữ, 5 GB băng thông/tháng, bucket đặt giới hạn 25 MB/file và chỉ nhận ảnh.
- Supabase Free: tạm dừng sau 7 ngày ít hoạt động; DB 500 MB; 50.000 MAU.
- Lý do thao tác file chạy ở trình duyệt admin: mỗi lệnh Storage là một subrequest, Workers Free chỉ cho 50 subrequest/request.
- Cloudflare Images transformations (gói Free): 5.000 lượt/tháng. Không dùng, vì ảnh đã resize lúc upload.

### Mô hình dữ liệu tối thiểu

- `site_settings` (một dòng): nội dung hero, hero media, giới thiệu, tên pháp lý, mã số thuế, địa chỉ, logo, kênh liên hệ (Zalo, điện thoại, email). Trường văn bản có hậu tố `_vi`. Lưu là có hiệu lực ngay.
- `projects`: id, slug, `status` (`draft`/`published`), `category` (enum CONF-21), thứ tự, cờ nổi bật, ảnh bìa, metadata, tiêu đề/mô tả/ý tưởng `_vi`, URL tour JEGA, poster tour, `published_at`. Constraint `publish_requires_content`.
- `media_assets`: project, `kind` (render/photo/drawing/tour_poster/hero), thứ tự, `prefix` + `files` trong bucket, kích thước, alt/caption `_vi`, điểm cắt `focal_x/y`, `is_public` (= nằm ở bucket public).
- `admin_users`: liên kết tới user Supabase Auth. Chỉ thêm thủ công bằng SQL/dashboard; không có đường nào để người dùng tự thêm mình.

### Truy cập và media

- Bảo vệ trang admin và mọi endpoint ghi ở server (kiểm tra session + `admin_users`). RLS trên database là lớp kiểm soát độc lập: khách (anon) chỉ đọc `projects` có `status = 'published'` và media tương ứng.
- Không để API trả bản nháp rồi ẩn bằng CSS.
- Hai bucket Supabase: `media-private` (nháp, chỉ admin đọc qua signed URL 5 phút) và `media-public` (đọc công khai qua URL). Upload vào công trình đang xuất bản / hero đi thẳng vào bucket public.
- Xuất bản: server lưu form + kiểm tra đủ nội dung bắt buộc → trình duyệt admin `move` từng ảnh sang bucket public và đặt `is_public` → server kiểm tra mọi ảnh đã public rồi mới đổi `status`. Bị ngắt giữa chừng: bấm lại, thao tác chạy lại an toàn.
- Gỡ xuất bản: server đổi `status` trước (trang biến mất ngay) → trình duyệt chuyển ảnh về bucket private.
- Xóa ảnh: xóa bản ghi trước rồi mới xóa file. Xóa công trình: xóa từng ảnh rồi xóa bản ghi công trình.
- Không có secret phía server: URL + publishable key của Supabase là công khai; mọi quyền ghi do RLS (bảng + storage) kiểm tra theo phiên đăng nhập. Không dùng service role key.

## 11. Responsive, hiệu năng và khả năng sử dụng

- Desktop: giữ hero rộng, headline phía trái, ba công trình cạnh nhau và nhịp hình lớn của mẫu.
- Tablet: giảm gutter/type scale, chuyển lưới hợp lý mà không làm hình kiến trúc quá nhỏ.
- Mobile: một cột, tiêu đề vừa màn hình; hiển thị rõ toàn bộ công trình trọng tâm, dùng focal point riêng nếu cần. Không bê tỷ lệ video quay màn hình thành layout điện thoại.
- Không có tràn ngang ở 390 px; kiểm tra thêm 768 px và 1440 px. Đây là kích thước QA đề xuất, không phải breakpoint gốc.
- Ảnh có kích thước khai báo, dùng `srcset` từ các biến thể WebP; ảnh full chỉ tải khi mở; tránh layout shift.
- Gallery/video dưới màn hình nạp chậm. Không tải iframe JEGA và video nặng ngay khi vào trang.
- Link, nút, lightbox có focus rõ, nhãn phù hợp; lightbox đóng bằng Escape và trả focus về phần tử mở.
- Bản vẽ đọc được khi zoom.
- Slug, metadata, sitemap chỉ dùng công trình công khai. Admin và trang preview được bảo vệ, không đưa vào chỉ mục.

## 12. Tiêu chí nghiệm thu

| ID | Bằng chứng cần có |
| --- | --- |
| QA-01 | Ảnh chụp desktop đối chiếu frame tham chiếu: đúng nền, tỷ lệ headline, vị trí công trình hero, ba ô ảnh và khoảng trắng. |
| QA-02 | Ảnh chụp 390/768/1440 px; không tràn ngang, chữ và công trình chính không bị cắt. |
| QA-03 | Khách vào công trình đã xuất bản, mở ảnh/bản vẽ/video được; mục thiếu nội dung được ẩn. |
| QA-04 | Admin tạo công trình, upload nội dung, sắp xếp, lưu, đăng xuất rồi đăng nhập lại vẫn còn dữ liệu. |
| QA-05 | Công trình nháp và ảnh nháp không truy cập được qua trang công khai, API hoặc URL bucket public; user Supabase không có trong `admin_users` không có quyền admin hay quyền storage. |
| QA-06 | Xuất bản copy đủ media sang bucket public và trang hiện sau tối đa 60 giây; gỡ xuất bản chặn trang và xóa media public. |
| QA-07 | Link JEGA thật được thử trong trình duyệt ở phiên khách: iframe tải khi bấm và dùng được, nút mở ngoài hoạt động, đã ghi nhận có hay không giỏ hàng trong iframe. |
| QA-08 | Ảnh upload sinh đủ biến thể WebP; file không phải ảnh hoặc vượt 25 MB bị từ chối; link không phải YouTube bị từ chối khi lưu. |
| QA-09 | Hero có poster/fallback; reduced motion và nút pause được kiểm tra; không có âm thanh tự phát. |
| QA-10 | Typecheck, lint, build và kiểm thử liên quan có kết quả được ghi lại; không báo “đã kết nối” nếu mới dùng mock. |
| QA-11 | Link `/en` cũ trả 301 về đúng trang tiếng Việt; trang không còn `hreflang`/nút chuyển ngôn ngữ; xuất bản bị chặn khi thiếu tên, mô tả hoặc ý tưởng. |

Nếu chưa có asset thật hoặc thông tin kết nối, ghi chính xác mục chưa kiểm tra. Không thay bằng nội dung giả rồi đánh dấu hoàn tất.

## 13. Thông tin còn thiếu

| Nội dung | Xử lý hiện tại | Cần bổ sung trước khi công khai |
| --- | --- | --- |
| Logo, mã số thuế, địa chỉ | Trường cấu hình, ẩn khi trống | Giá trị thật |
| Hero | Video minh họa mặc định (CONF-25) | Ảnh hero của công trình thật nếu muốn thay |
| Công trình thật | Schema sẵn, dữ liệu demo phải ghi nhãn và chỉ dùng khi phát triển | Tên, metadata, ảnh, bản vẽ, mô tả của ít nhất một công trình |
| Tour JEGA | Link mẫu đã kiểm tra header/JS | Thử trong trình duyệt; kiểm tra có tắt được giỏ hàng trong tài khoản JEGA |
| Liên hệ | Cấu hình được; ẩn kênh chưa có dữ liệu | Zalo/điện thoại/email |
| Hạ tầng | Kiến trúc đã chốt, chưa tạo tài nguyên | Tài khoản Cloudflare và Supabase, secret, tên miền |

Không tự tạo số điện thoại, email, mã số thuế hoặc link liên hệ giả. Những thông tin thiếu không chặn việc dựng bố cục và cấu trúc dữ liệu, nhưng chặn việc tuyên bố website đã sẵn sàng công khai.

## 14. Quy trình dùng chung cho Claude Code và Codex

1. Đọc `AGENTS.md`, tài liệu này và `PROJECT_STATE.md` trước khi sửa.
2. Xem video và các frame; nếu công cụ không hỗ trợ đọc ảnh/video, nói rõ giới hạn và dùng brief thị giác để tiếp tục phần không phụ thuộc.
3. Kiểm tra repository/lockfile/cấu hình hiện có; không scaffold đè dự án đang có.
4. Tóm tắt việc sắp làm, thực hiện theo phần, ưu tiên landing page gần mẫu trước khi mở rộng CMS.
5. Ghi nhận điều chỉnh quan trọng và kết quả kiểm tra vào `PROJECT_STATE.md`. Chỉ đổi yêu cầu đã xác nhận khi có chỉ dẫn mới của người dùng.
6. Khi đổi từ AI này sang AI kia, công cụ tiếp theo đọc trạng thái hiện tại trước, tránh xây lại phần đã xong.
7. Không để hai công cụ đồng thời sửa cùng file khi chưa có cách chia việc rõ ràng. Không thay dữ liệu mẫu thành dữ liệu thật bằng suy đoán.

`PROJECT_CONTEXT.md` giữ yêu cầu và quyết định. `PROJECT_STATE.md` giữ tiến độ thực tế, giới hạn, lệnh kiểm tra và việc tiếp theo; không trộn hai loại thông tin.

## 15. Nguồn kỹ thuật đã tham khảo

Đối chiếu ngày 15/10/2026. Kiểm tra lại tài liệu hiện hành khi triển khai. Đây là căn cứ cho khả năng công nghệ, không xác nhận tài khoản/asset cụ thể của người dùng.

- [JEGA: tour VR và đường link chia sẻ](https://jega.asia/vi/cach-cong-nghe-thuc-te-ao-vr-720-giup-kien-truc-su-chot-hop-dong-noi-that-nhanh-hon-n138.html).
- [Astro: adapter Cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).
- [Astro gia nhập Cloudflare](https://astro.build/blog/joining-cloudflare/).
- [Cloudflare Workers: giới hạn](https://developers.cloudflare.com/workers/platform/limits/) và [tăng giới hạn kích thước Worker](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/).
- [Supabase Storage: kiểm soát truy cập](https://supabase.com/docs/guides/storage/security/access-control), [bucket](https://supabase.com/docs/guides/storage/buckets/fundamentals), [giới hạn upload](https://supabase.com/docs/guides/storage/uploads/file-limits).
- [Cloudflare Images: bảng giá](https://developers.cloudflare.com/images/pricing/).
- [Supabase: tạm dừng project Free](https://supabase.com/docs/guides/platform/free-project-pausing) và [bảng giá](https://supabase.com/pricing).
- [Supabase: auth cho ứng dụng server-rendered](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- [model-viewer](https://modelviewer.dev/examples/loading/) — tham khảo khi bổ sung 3D sau v1.
- [Codex: AGENTS.md](https://developers.openai.com/codex/guides/agents-md).
- [Claude Code: project instructions và import](https://code.claude.com/docs/en/memory).
