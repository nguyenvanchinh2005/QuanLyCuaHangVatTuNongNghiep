# Sản phẩm

<!-- impeccable:product-schema 1 -->

## Nền tảng

Ứng dụng web

## Công nghệ

Giao diện phía trước sử dụng HTML/CSS/JavaScript tĩnh, kết nối API PHP/PDO và MySQL để quản lý tồn kho sản phẩm và phiên tài khoản.

## Người dùng

Khách hàng mua vật tư nông nghiệp; nhân viên theo dõi hoạt động cửa hàng; quản trị viên quản lý sản phẩm và tồn kho. Trang mặc định là cửa hàng công khai; quyền truy cập giao diện quản lý được phân theo vai trò.

## Mục đích sản phẩm

Ứng dụng web gồm cửa hàng và giao diện quản lý vật tư nông nghiệp. Khách hàng duyệt sản phẩm, xem chi tiết và tạo tài khoản. Nhân viên theo dõi bảng điều khiển quản lý; quản trị viên quản lý danh mục sản phẩm và tồn kho trong MySQL. Tính năng hỗ trợ chăm sóc cây qua ảnh và thanh toán vẫn chỉ là mô phỏng.

## Định vị

Kết hợp cửa hàng vật tư nông nghiệp thiết thực với hướng dẫn chăm sóc cây và tính năng hỗ trợ nhận biết bệnh qua ảnh.

## Bối cảnh sử dụng

Khách hàng duyệt các danh mục như đất, phân bón, hạt giống và thuốc bảo vệ thực vật. Thẻ sản phẩm và trang chi tiết lấy dữ liệu qua API phía máy chủ. Nhân viên và quản trị viên được chuyển đến trang quản lý có bảo vệ; thay đổi sản phẩm của quản trị viên được lưu trong MySQL.

## Tính năng và giới hạn

- Màn hình đăng ký, đăng nhập và quản lý tài khoản.
- Danh mục, chi tiết, giá, tồn kho, tìm kiếm và bộ lọc sản phẩm sau khi máy chủ trả về dữ liệu.
- Giỏ hàng, đặt hàng, quản lý đơn hàng và thanh toán trực tuyến mô phỏng.
- Bài viết về bệnh cây, chức năng chọn/chụp ảnh, kết quả nhận diện mô phỏng và gợi ý sản phẩm liên quan.
- Giao diện quản trị dành cho người dùng, sản phẩm, đơn hàng và dữ liệu bệnh cây; nhân viên chỉ có quyền xem trong giao diện quản lý.
- Đăng ký và đăng nhập sử dụng phiên phía máy chủ. Người dùng chỉ có thể tự đăng ký tài khoản khách hàng; tài khoản nhân viên/quản trị viên được tạo qua CLI.
- Máy chủ PHP đọc sản phẩm qua `GET /api/san-pham` và chỉ cho phép quản trị viên tạo, cập nhật hoặc xóa sản phẩm. Trình duyệt không được kết nối trực tiếp với MySQL.
- Đơn hàng, thanh toán và nhận diện bệnh cây chỉ dành cho bản mẫu, không được máy chủ lưu lại.
- Tên biến và hàm trong mã nguồn nên dùng tiếng Việt không dấu, viết liền các từ.

## Cam kết thương hiệu

Người dùng cung cấp https://nongnghieppho.vn/ làm nguồn cảm hứng cho cửa hàng vật tư nông nghiệp và trải nghiệm mua sắm theo danh mục. Sản phẩm này không được giới thiệu là trang web chính thức của doanh nghiệp đó.

## Cơ sở thông tin

Hiện có mô tả tính năng cụ thể và trang cửa hàng công khai được tham chiếu. Chưa có tài nguyên thương hiệu, tích hợp thanh toán hoặc mô hình nhận diện bệnh cây. Máy chủ sử dụng bảng sản phẩm hiện có trong MySQL và bảng `taikhoan` để quản lý tài khoản đã xác thực.

## Nguyên tắc sản phẩm

- Giúp người dùng dễ tìm thấy các thao tác mua sắm và vận hành cửa hàng thường dùng.
- Sử dụng thuật ngữ nông nghiệp dễ hiểu với người trồng trọt tại Việt Nam.
- Gắn hướng dẫn về bệnh cây với vật tư phù hợp nhưng không trình bày gợi ý như kết quả chẩn đoán chắc chắn.
- Thể hiện rõ thanh toán và phân tích ảnh chỉ là tính năng của bản mẫu; không ám chỉ có thanh toán thực hoặc chẩn đoán tự động.