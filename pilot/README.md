# Thử ví tài khoản trên tên miền staging riêng

Giao diện tĩnh chạy ở chế độ minh họa khi chưa cấu hình API. Trang tài khoản không yêu cầu mật khẩu trong chế độ minh họa. Không dùng miền CDN preview để đăng nhập hay nhận tiền.

1. Triển khai nhánh thử trên một tên miền staging do bạn sở hữu. Giữ noindex và dùng một Gmail nội bộ. Chỉ đưa thông tin công khai vào HTML.
2. Tạo Supabase Auth riêng, bật email/password, xác nhận email và cấu hình URL quay về của staging. Tạo D1 mới và chạy schema.sql một lần. Gắn DB vào Worker bằng tên DB.
3. Triển khai wallet-worker.js dạng ES module riêng. Route cùng origin /wallet-api/*. Đặt FRONTEND_ORIGIN, PILOT_EMAIL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, BANK_ACCOUNT, BANK_CODE, APPS_SCRIPT_URL. Đặt SEPAY_API_KEY và WALLET_KEY_SECRET trong secret store.
4. Dùng một bản Apps Script test với Sheet key test, có cấu hình gói/giá/tồn kho. Đặt cùng WALLET_KEY_SECRET trong Script Properties. Triển khai bản code.gs của nhánh này tới Apps Script test. Tạo và kích hoạt key bằng ứng dụng trỏ về cùng kho key. Key trong Sheet thử không tự kích hoạt trên ứng dụng dùng Sheet production.
5. Thêm webhook SePay tách riêng tại /wallet-api/webhook, xác thực API Key, lọc đúng tài khoản nhận và các mã TMNAP. Giữ webhook bán key hiện tại. Chỉ bật thử sau khi cấu hình khớp. Sai số tiền, sai tài khoản hoặc thiếu nội dung cần đối soát thủ công theo sao kê, không tự cộng.
6. Tạo lệnh nạp từ Gmail được phép. Kiểm tra chuyển tiền thật khớp lệnh, thông báo trùng, hai yêu cầu mua cùng lúc, hết hàng, cấp key lỗi giữa chừng và quay lại đơn. D1 lưu biến động số dư. Cấp key có thể được thử lại bằng đúng mã đơn, và Apps Script ghi kết quả cấp hoặc từ chối để xử lý lặp an toàn.
7. Ảnh trong bản này chỉ là mẫu xem nhỏ có watermark. Đơn ảnh tiếp tục mô phỏng trên trình duyệt. Không bật thu tiền ảnh cho đến khi có xử lý tệp riêng trên máy chủ, kiểm tra người sở hữu và thanh toán trước khi giao ảnh đủ phân giải. Không dùng IndexedDB làm bằng chứng thanh toán.
