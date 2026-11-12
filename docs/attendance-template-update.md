# Cập nhật mẫu 2 — 12/11/2026

Mốc source: ac98eafb9fee6c1c7f9b12939dc186a6b09bc68d.

## Phạm vi

- Mẫu 2 có module vẽ, font, CSS, logo, bản đồ và công tắc riêng.
- Tám mục chính: Logo, Tiêu đề, Kiểu chữ nghệ thuật, Thẻ, Thời gian, Vị trí, Tọa độ, Bản đồ.
- Mã ảnh, thương hiệu và dòng cam kết có công tắc riêng trong phần phụ của mẫu 2.
- Tắt logo bỏ hoàn toàn vùng logo và thu khung giờ; bật logo làm khung cao/rộng hơn, giữ điểm neo dưới như hai ảnh tham chiếu.
- Font chữ, gradient giờ, nền hoa văn, xuống dòng địa chỉ và vị trí các khối được dựng lại theo ảnh 3024×4032.
- Hai mẫu giữ riêng bản nháp đã tạo, độ thu phóng và vị trí khi chuyển mẫu. Ảnh nguồn dùng chung.
- Mẫu 2 cập nhật ngay khi đổi công tắc hoặc thông tin sau khi đã tạo ảnh.
- Mã trang trí mẫu 2 ổn định giữa xem trước và xuất PNG. Đây không phải tích hợp dịch vụ xác minh của Timemark.

## Tệp triển khai

Thay app/index.html và bổ sung app/attendance-template.js, app/attendance-template.css, toàn bộ app/attendance-assets/. Giữ nguyên đường dẫn tương đối. Các font và giấy phép OFL đi kèm cần được tải lên cùng mã nguồn.

Không triển khai thư mục QA hoặc ảnh tham chiếu. Không có ảnh cá nhân hay logo của người dùng được đưa vào source.

## Kiểm tra

Chạy từ thư mục repository:

    node tests/verify-template-isolation.mjs

Kiểm tra trình duyệt trên bản làm việc riêng đã đối chiếu:

- Ảnh mẫu 1 với cùng đầu vào/font/mã thử trùng từng pixel với source gốc.
- Chuyển mẫu 1 → mẫu 2 → mẫu 1 giữ nguyên ảnh, vị trí, độ thu phóng và công tắc.
- Logo, tiêu đề, kiểu chữ, thẻ, thời gian, địa chỉ, tọa độ, bản đồ và các thành phần phụ có tác dụng độc lập.
- Ảnh xem trước mẫu 2 ổn định khi vẽ lại, xuất được PNG.
- Không tràn ngang ở các độ rộng 320, 390 và 768 px trong trình duyệt kiểm tra.

## Giới hạn đã xác định

- Bản đồ nhận ảnh người dùng tải lên; chưa tích hợp Apple Maps hoặc tự tạo bản đồ từ GPS. Nút GPS lấy tọa độ và tên địa chỉ.
- Ảnh tham chiếu chỉ thể hiện trạng thái tắt của Kiểu chữ nghệ thuật, Thẻ và Tọa độ. Các mục này đã có chức năng riêng, nhưng chưa có ảnh từ app để đối chiếu bố cục khi bật.
- Hoa văn được vẽ lại bằng Canvas; font chọn theo đối chiếu hình. Chưa xác nhận trùng 100% từng pixel với tài nguyên nội bộ của ứng dụng Timemark.
- Chưa chạy trên iPhone thật. Luồng chia sẻ/lưu ảnh iOS và các hàm vẽ mẫu 1 được giữ nguyên mã nguồn.

Tại thời điểm tạo gói, thay đổi mới nằm trên nhánh làm việc; việc có mặt trên website thật cần được xác nhận riêng bằng commit/triển khai.

## Giao diện nhập gọn (bản cập nhật tiếp theo)

- Hai tab Mẫu 1 / Mẫu 2, ảnh nguồn và xem trước nằm trên danh sách thông tin.
- Chạm vào dòng thông tin để mở bảng sửa; nút Xong đóng bảng và giữ giá trị. Công tắc bật/tắt độc lập với nút sửa.
- Nút lấy giờ/GPS nằm trong mục tương ứng. Các mục ít dùng nằm trong Tùy chỉnh thêm.
- Dùng lại các ô nhập và listener gốc, không sao chép dữ liệu qua form trung gian. Không thay đổi attendance-template.js hay các hàm vẽ/xuất ảnh.
- Bổ sung compact-editor.js và compact-editor.css; tải hai tệp này cùng app/index.html.
- Cơ chế key giữ nguyên. Bản thử riêng và PR chưa thay thế website chính.
