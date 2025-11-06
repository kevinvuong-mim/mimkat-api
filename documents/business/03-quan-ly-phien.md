# Quản lý Phiên Đăng nhập

## Phiên đăng nhập (Session) là gì?

**Phiên đăng nhập** là một "phiếu vào cửa" ảo mà hệ thống cấp cho bạn sau khi đăng nhập thành công. Mỗi lần bạn đăng nhập từ một thiết bị, hệ thống tạo một phiên mới.

### Ví dụ dễ hiểu

Giống như bạn đến công viên:

- 🎫 Mua vé (= Đăng nhập)
- 🎟️ Nhận vé vào cửa (= Phiên đăng nhập)
- ⏰ Vé có thời hạn (= Phiên có thời gian sống)
- 🚪 Ra khỏi cửa là vé hết giá trị (= Đăng xuất)

## Thông tin trong Phiên

Mỗi phiên đăng nhập lưu trữ các thông tin:

### 1. Thông tin Cơ bản

- **Mã phiên**: Một chuỗi ký tự duy nhất (như mã vạch trên vé)
- **Thời gian tạo**: Khi nào bạn đăng nhập
- **Thời gian hết hạn**: Khi nào phiên hết hiệu lực
- **Thời gian dùng lần cuối**: Lần cuối bạn dùng ứng dụng

### 2. Thông tin Thiết bị

- **Tên thiết bị**: VD: "iPhone 13 của Minh"
- **Loại thiết bị**: Điện thoại / Máy tính / Máy tính bảng
- **Hệ điều hành**: iOS, Android, Windows, macOS
- **Trình duyệt**: Chrome, Safari, Firefox...

### 3. Thông tin Vị trí

- **Địa chỉ IP**: Địa chỉ mạng của thiết bị
- **Vị trí ước tính**: Thành phố, quốc gia (dựa trên IP)

## Vòng đời của một Phiên

```
┌─────────────────────────────────────────────────────────┐
│                   VÒNG ĐỜI PHIÊN                        │
└─────────────────────────────────────────────────────────┘

1. KHỞI TẠO (Đăng nhập thành công)
   ↓
   • Tạo phiên mới
   • Ghi nhận thiết bị
   • Cấp Access Token (15 phút)
   • Cấp Refresh Token (7 ngày)

2. HOẠT ĐỘNG (Sử dụng bình thường)
   ↓
   • Access Token được dùng để truy cập
   • Mỗi 15 phút, token được làm mới tự động
   • Ghi nhận thời gian sử dụng lần cuối

3. KẾT THÚC (Một trong các trường hợp sau)
   ↓
   • Người dùng đăng xuất thủ công
   • Hết thời gian (7 ngày không dùng)
   • Đăng xuất từ tất cả thiết bị
   • Đổi mật khẩu
   • Admin khóa tài khoản
```

## Chức năng Quản lý Phiên

### 1. Xem danh sách Phiên đang hoạt động

Người dùng có thể xem tất cả thiết bị đang đăng nhập:

**Thông tin hiển thị:**

```
📱 iPhone 13 Pro
   Địa điểm: Hà Nội, Việt Nam
   Lần dùng cuối: 5 phút trước
   IP: 116.xxx.xxx.xxx
   [Đây là thiết bị hiện tại]

💻 MacBook Pro
   Địa điểm: TP. Hồ Chí Minh, Việt Nam
   Lần dùng cuối: 2 giờ trước
   IP: 171.xxx.xxx.xxx
   [Đăng xuất]

🖥️ Windows PC
   Địa điểm: Hà Nội, Việt Nam
   Lần dùng cuối: 3 ngày trước
   IP: 14.xxx.xxx.xxx
   [Đăng xuất]
```

### 2. Đăng xuất một Phiên cụ thể

**Khi nào cần:**

- Quên đăng xuất ở máy công ty
- Mất điện thoại, muốn đăng xuất ngay
- Thấy thiết bị lạ trong danh sách

**Cách thực hiện:**

1. Vào "Cài đặt" → "Bảo mật"
2. Chọn "Thiết bị đang đăng nhập"
3. Click "Đăng xuất" bên cạnh thiết bị muốn xóa

**Kết quả:**

- ✅ Phiên đó bị hủy ngay lập tức
- ✅ Thiết bị đó không thể tiếp tục sử dụng
- ✅ Phải đăng nhập lại nếu muốn dùng

### 3. Đăng xuất Tất cả Phiên (trừ hiện tại)

**Khi nào cần:**

- Nghi ngờ tài khoản bị xâm nhập
- Muốn "reset" tất cả phiên đăng nhập
- Đổi mật khẩu và muốn đăng xuất mọi nơi

**Cách thực hiện:**

1. Vào "Cài đặt" → "Bảo mật"
2. Click "Đăng xuất tất cả thiết bị khác"
3. Xác nhận hành động

**Kết quả:**

- ✅ Tất cả phiên khác bị hủy
- ✅ Chỉ thiết bị hiện tại còn đăng nhập
- ✅ Các thiết bị khác phải đăng nhập lại

### 4. Gia hạn Phiên tự động

Người dùng không cần làm gì, hệ thống tự động gia hạn:

**Cơ chế:**

```
Phút 1-15: Dùng Access Token
    ↓
Phút 16: Access Token hết hạn
    ↓
Ứng dụng tự động dùng Refresh Token
    ↓
Nhận Access Token mới (15 phút)
    ↓
Lặp lại cho đến khi Refresh Token hết hạn (7 ngày)
```

**Lợi ích:**

- Không bị gián đoạn khi đang làm việc
- Không phải đăng nhập lại trong 7 ngày
- Vẫn đảm bảo bảo mật cao

## Thời gian Sống của Phiên

### Các mốc thời gian quan trọng

| Loại Token              | Thời gian sống | Mục đích                                |
| ----------------------- | -------------- | --------------------------------------- |
| **Access Token**        | 15 phút        | Truy cập các chức năng hệ thống         |
| **Refresh Token**       | 7 ngày         | Làm mới Access Token                    |
| **Phiên với "Ghi nhớ"** | 30 ngày        | Đăng nhập lâu dài trên thiết bị tin cậy |

### Các trường hợp Phiên hết hạn

#### 1. Hết hạn tự nhiên (sau 7 ngày)

- **Nguyên nhân**: Không sử dụng ứng dụng trong 7 ngày
- **Kết quả**: Phải đăng nhập lại
- **Thông báo**: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại"

#### 2. Đăng xuất thủ công

- **Nguyên nhân**: Người dùng click "Đăng xuất"
- **Kết quả**: Phiên bị xóa ngay lập tức
- **Thông báo**: "Đăng xuất thành công"

#### 3. Đổi mật khẩu

- **Nguyên nhân**: Người dùng đổi mật khẩu
- **Kết quả**: TẤT CẢ phiên bị xóa (bao gồm cả thiết bị hiện tại)
- **Thông báo**: "Đã đổi mật khẩu. Vui lòng đăng nhập lại"
- **Lý do**: Bảo mật - Đảm bảo chỉ người biết mật khẩu mới mới truy cập được

#### 4. Phát hiện hoạt động bất thường

- **Nguyên nhân**: Hệ thống phát hiện đăng nhập nghi ngờ
- **Kết quả**: Tạm khóa phiên
- **Thông báo**: "Phát hiện hoạt động bất thường. Vui lòng xác thực lại"
- **Hành động**: Yêu cầu xác thực email hoặc OTP

## Bảo mật Phiên

### 1. Mã hóa Refresh Token

**Vấn đề:**
Nếu Refresh Token bị đánh cắp, kẻ xấu có thể truy cập tài khoản trong 7 ngày.

**Giải pháp:**

- Refresh Token được mã hóa trước khi lưu vào database
- Ngay cả admin hệ thống cũng không thể đọc được
- Chỉ hệ thống mới giải mã được

### 2. Phát hiện Token bị đánh cắp

**Dấu hiệu:**

- Cùng một Refresh Token được dùng từ 2 IP khác nhau
- Token được dùng sau khi đã đăng xuất

**Hành động:**

- ❌ Hủy ngay lập tức token đó
- ❌ Hủy tất cả phiên của người dùng
- ✉️ Gửi email cảnh báo khẩn cấp
- 🔒 Yêu cầu đổi mật khẩu

### 3. Giới hạn Số lượng Phiên

**Hiện tại:** KHÔNG giới hạn số phiên

**Tương lai (có thể):**

- Giới hạn tối đa 10 thiết bị cùng lúc
- Khi đăng nhập thiết bị thứ 11, phiên cũ nhất bị xóa
- Mục đích: Ngăn chặn chia sẻ tài khoản quá nhiều

### 4. Cảnh báo Phiên mới

Mỗi khi có phiên đăng nhập mới:

- ✉️ Gửi email thông báo
- 📝 Ghi log để kiểm tra sau

**Email thông báo gồm:**

- 🕐 Thời gian đăng nhập
- 📱 Tên thiết bị
- 📍 Địa điểm ước tính
- 🔗 Link "Không phải tôi" để khóa tài khoản

## Dọn dẹp Phiên tự động

### Phiên nào bị xóa?

Hệ thống tự động xóa các phiên:

- ⏰ Hết hạn (quá 7 ngày)
- 📅 Không dùng lâu (quá 30 ngày)
- ❌ Đã đăng xuất

### Thời gian dọn dẹp

- **Tần suất**: Mỗi ngày lúc 3 giờ sáng
- **Mục đích**:
  - Giải phóng dung lượng database
  - Tăng tốc độ truy vấn
  - Bảo mật: Xóa dữ liệu cũ không còn dùng

### Ảnh hưởng đến người dùng

✅ **KHÔNG ảnh hưởng** đến người dùng đang hoạt động

❌ Chỉ xóa các phiên đã hết hạn

## Trường hợp Đặc biệt

### Trường hợp 1: Đang dùng app, bị đăng xuất đột ngột

**Nguyên nhân có thể:**

- Phiên hết hạn đúng lúc đang dùng
- Ai đó đăng xuất từ thiết bị khác
- Hệ thống phát hiện bất thường

**Giải pháp:**

- Đăng nhập lại
- Kiểm tra email xem có cảnh báo không
- Xem danh sách thiết bị đăng nhập

### Trường hợp 2: Không thấy thiết bị đã đăng nhập

**Nguyên nhân:**

- Thiết bị đã được đăng xuất
- Phiên đã hết hạn
- Lỗi hiển thị

**Giải pháp:**

- Đăng nhập lại từ thiết bị đó
- Kiểm tra lại sau vài phút

### Trường hợp 3: Thấy thiết bị lạ trong danh sách

**Nguyên nhân:**

- Tài khoản có thể bị xâm nhập
- Bạn đăng nhập nhưng quên
- Thiết bị được đặt tên tự động không đúng

**Hành động NGAY:**

1. ⚠️ Đăng xuất thiết bị đó
2. 🔒 Đổi mật khẩu ngay
3. ❌ Đăng xuất tất cả thiết bị
4. ✉️ Kiểm tra email cảnh báo
5. 📞 Liên hệ hỗ trợ nếu cần

## Mẹo Sử dụng

### ✅ Nên làm

- **Kiểm tra định kỳ**: Xem danh sách thiết bị 1 tháng 1 lần
- **Đăng xuất khi không dùng**: Đặc biệt trên máy công cộng
- **Đặt tên thiết bị rõ ràng**: Giúp dễ nhận biết
- **Đọc email cảnh báo**: Phản ứng nhanh khi có vấn đề

### ❌ Không nên làm

- **Chia sẻ tài khoản**: Mỗi người nên có tài khoản riêng
- **Để lâu không kiểm tra**: Có thể bị xâm nhập mà không biết
- **Bỏ qua cảnh báo**: Email cảnh báo rất quan trọng
- **Dùng WiFi công cộng không bảo mật**: Dễ bị đánh cắp token

## Thống kê và Báo cáo

### Thông tin người dùng có thể xem

- 📊 Số lượng thiết bị đang đăng nhập
- 📈 Lịch sử đăng nhập gần đây
- 🌍 Các địa điểm đã đăng nhập
- ⏰ Thời gian hoạt động trên mỗi thiết bị

### Mục đích

- Giúp người dùng kiểm soát tài khoản
- Phát hiện sớm hoạt động bất thường
- Minh bạch về cách dữ liệu được sử dụng

---

**Tài liệu liên quan:**

- [Quy trình Đăng nhập](02-dang-nhap.md)
- [Bảo mật và Quyền riêng tư](04-bao-mat.md)
- [FAQ - Câu hỏi thường gặp](06-faq.md)
