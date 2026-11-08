---
name: Vườn Phố
description: Cửa hàng vật tư nông nghiệp và hướng dẫn chăm sóc cây
colors:
  leaf-green: "#176b42"
  leaf-pale: "#e9f2e8"
  citrus: "#a94d13"
  garden-bg: "#f6f7f3"
  garden-text: "#252b25"
  garden-muted: "#68736b"
  garden-border: "#e3e8df"
  paper: "#ffffff"
  alert: "#bd4c3e"
typography:
  display:
    fontFamily: "Figtree, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  body:
    fontFamily: "Figtree, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Figtree, sans-serif"
    fontSize: "12px"
    fontWeight: 700
rounded:
  sm: "4px"
  md: "5px"
spacing:
  sm: "8px"
  md: "14px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.leaf-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 17px"
    height: "43px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.garden-text}"
    rounded: "{rounded.sm}"
    padding: "9px 11px"
    height: "40px"
---

# Hệ thống thiết kế: Vườn Phố

## Tổng quan

Giao diện là một cửa hàng vật tư làm vườn thiết thực tại Việt Nam, giúp người dùng dễ dàng mua sắm, tìm hiểu thông tin chăm sóc cây và quản lý cửa hàng. Cửa hàng là màn hình mặc định; nhân viên và quản trị viên đã xác thực truy cập giao diện quản lý theo vai trò. Cửa hàng tổ chức nội dung theo danh mục; chỉ dẫn về trang và trạng thái giúp dễ theo dõi các màn hình vận hành. Thẻ và chi tiết sản phẩm chỉ hiển thị dữ liệu từ API PHP kết nối MySQL. Các thao tác tạo, đọc, cập nhật và xóa của quản trị viên được lưu lại; nhân viên chỉ có quyền xem sản phẩm. Phiên tài khoản được máy chủ xác thực.

## Màu sắc

Bảng màu kết hợp sắc xanh cây với các bề mặt xanh lá nhạt và vùng trung tính dịu mắt; màu cam đậm được dùng làm điểm nhấn cho nhãn sản phẩm.

### Màu chính
- **Xanh Lá** (#176b42): Thao tác chính, mục điều hướng đang chọn, liên kết và nhận diện ngành nông nghiệp.
- **Xanh Lá Nhạt** (#e9f2e8): Nền nội dung nổi bật và một số vùng sáng.

### Màu phụ
- **Cam** (#a94d13): Nhãn sản phẩm và các điểm nhấn nhỏ; khi dùng chữ trắng cần đảm bảo độ tương phản dễ đọc.

### Màu trung tính
- **Nền Vườn** (#f6f7f3): Nền chính của trang.
- **Chữ Vườn** (#252b25): Tiêu đề và nội dung chính.
- **Chữ Phụ** (#68736b): Nhãn phụ và phần mô tả.
- **Viền Vườn** (#e3e8df): Đường viền thẻ, trường nhập và bảng.
- **Trắng** (#ffffff): Thẻ sản phẩm, biểu mẫu và ngăn trượt.
- **Cảnh báo** (#bd4c3e): Trạng thái lỗi và thao tác xóa.

## Kiểu chữ

- **Phông chữ tiêu đề lớn:** Figtree, sans-serif
- **Phông chữ nội dung:** Figtree, sans-serif
- **Phông chữ nhãn:** Figtree, sans-serif

**Đặc điểm:** Phông chữ không chân gọn gàng, thân thiện giúp tên sản phẩm và dữ liệu vận hành dễ đọc mà không khiến cửa hàng trở nên khô cứng.

### Thứ bậc
- **Tiêu đề lớn** (700, 48px trên máy tính / 40px trên máy tính bảng / 34px trên điện thoại, 1.05): Tiêu đề chính của cửa hàng.
- **Tiêu đề** (700, 30px, bình thường): Tiêu đề màn hình.
- **Tiêu đề mục** (700, 19–23px, bình thường): Tiêu đề phần và bảng điều khiển.
- **Nội dung** (400, 13–15px, 1.5–1.65): Mô tả sản phẩm, hướng dẫn và nội dung bổ trợ.
- **Nhãn** (700, 11–12px): Điều hướng, bộ lọc, danh mục và trạng thái.

## Bố cục

Trên máy tính, cửa hàng có vùng nội dung rộng 1.240px, khu vực giới thiệu chăm sóc cây chia làm hai phần, sáu cột danh mục và bốn cột sản phẩm. Trên máy tính bảng, số cột danh mục và sản phẩm giảm xuống; dưới 640px, danh mục hiển thị thành ba cột, sản phẩm thành hai cột và thanh điều hướng cố định phía dưới thay đổi theo vai trò đã đăng nhập. Trên màn hình nhỏ, hàng tìm kiếm tự xuống dòng. Bảng cuộn trong vùng giới hạn riêng thay vì làm trang rộng ra.

## Độ nổi và chiều sâu

Bề mặt phần lớn phẳng và được phân tách bằng đường viền mảnh. Khi rê chuột, thẻ sản phẩm có bóng đổ nhẹ lệch xuống; ngăn giỏ hàng dùng bóng cạnh đậm hơn để tách biệt với trang. Trạng thái lấy nét được thể hiện bằng đường viền rõ ràng thay vì hiệu ứng nổi.

### Quy ước bóng đổ
- **Khi rê chuột lên thẻ** (`0 14px 38px rgba(27, 55, 35, .09)`): Trạng thái rê chuột của thẻ sản phẩm.
- **Ngăn trượt** (`-12px 0 38px rgba(20, 33, 25, .16)`): Ngăn giỏ hàng đang mở.

## Hình dạng

Nút, trường nhập và các mục lặp lại dùng góc bo vừa phải từ 4–5px. Nhãn trạng thái nhỏ có dạng viên thuốc bo tròn, còn biểu tượng danh mục nằm trong hình tròn. Đường viền đảm nhiệm phần lớn việc phân nhóm.

## Thành phần

### Nút
- **Hình dạng:** Góc bo gọn 4px.
- **Nút chính:** Nền xanh lá, chữ trắng; chiều cao tối thiểu 43px và khoảng đệm ngang 17px.
- **Rê chuột / Lấy nét:** Nút chính tối hơn đôi chút; khi lấy nét bằng bàn phím, dùng viền cam dễ nhận biết.
- **Nút phụ / Trong suốt:** Nền trắng hoặc trong suốt, có viền mảnh hoặc chữ màu xanh lá.

### Nhãn
- **Kiểu:** Nhãn nền màu nhỏ dành cho thẻ sản phẩm và trạng thái; cần đảm bảo độ tương phản giữa chữ và nền.
- **Trạng thái:** Mục điều hướng và thẻ đang chọn dùng chữ xanh lá cùng gạch chân 2px.

### Thẻ / Khung chứa
- **Góc bo:** 4px.
- **Nền:** Màu trắng trên nền vườn.
- **Bóng đổ:** Phẳng ở trạng thái bình thường; chỉ thêm bóng nhẹ khi rê chuột lên thẻ sản phẩm.
- **Viền:** Đường viền mảnh theo màu viền vườn.
- **Khoảng đệm bên trong:** 9–20px tùy mật độ nội dung.

### Ô nhập / Trường dữ liệu
- **Kiểu:** Nền trắng, viền màu viền vườn dày 1px, góc bo 4px.
- **Lấy nét:** Viền xanh lá và quầng sáng xanh nhẹ.
- **Lỗi / Vô hiệu hóa:** Lỗi dùng màu cảnh báo; thao tác bị vô hiệu hóa vẫn phải thể hiện rõ là không khả dụng.

### Điều hướng
- **Máy tính:** Thanh điều hướng ngang màu trắng có biểu tượng và nhãn; mục đang mở dùng chữ xanh lá và gạch chân.
- **Điện thoại:** Bốn thao tác dành cho khách hàng hoặc năm thao tác dành cho nhân viên, có biểu tượng và nhãn ngắn, kích thước phù hợp thao tác bằng ngón tay cái.
- **Tìm kiếm:** Trường tìm kiếm rộng dùng chung trên đầu trang, kèm nút gửi màu xanh lá đặc.

### Thẻ sản phẩm
- **Nội dung:** Ảnh sản phẩm thực tế, danh mục, tên sản phẩm, tồn kho, giá và thao tác thêm vào giỏ riêng biệt.
- **Cách hoạt động:** Chỉ hiển thị dữ liệu từ API phía máy chủ; nhấn tên/thẻ sản phẩm sẽ mở hộp thoại chi tiết, thao tác yêu thích và giỏ hàng tách biệt, bộ lọc cập nhật danh sách kết quả.

## Nên làm và không nên làm

- Nên trình bày trạng thái sản phẩm, danh mục, đơn hàng và tồn kho bằng nhãn nhất quán, dễ quét.
- Nên liên kết bài viết chăm sóc cây với vật tư liên quan nhưng không mô tả liên kết đó như một kết quả chẩn đoán.
- Nên tải dữ liệu sản phẩm từ điểm cuối của máy chủ; máy chủ, không phải trình duyệt, kết nối với cơ sở dữ liệu.
- Nên giữ lưới sản phẩm hai cột trên điện thoại và thanh điều hướng cố định phía dưới.
- Nên ghi rõ các kết quả thanh toán và phân tích ảnh chỉ có ở phía giao diện là mô phỏng.
- Không ám chỉ đơn hàng/thanh toán được lưu hoặc bệnh cây được nhận diện tự động; tài khoản đã xác thực và sản phẩm do quản trị viên quản lý được lưu trong MySQL.
- Không thêm danh mục sản phẩm cố định trong mã hoặc kết nối trực tiếp giao diện với cơ sở dữ liệu.
- Không dùng các nhãn trang trí riêng của cửa hàng làm quy ước tiêu đề cho toàn hệ thống.
- Không dùng màu cam làm màu chữ nhỏ trên nền trắng nếu độ tương phản thấp hơn 4.5:1.