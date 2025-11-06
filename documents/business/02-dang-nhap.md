# Quy trình Đăng nhập

## Tổng quan

Sau khi đã có tài khoản, người dùng cần đăng nhập để sử dụng Mimkat. Hệ thống hỗ trợ 2 phương thức:

1. **Đăng nhập bằng Email/Mật khẩu**
2. **Đăng nhập bằng Google**

## Phương thức 1: Đăng nhập Email/Mật khẩu

### Quy trình từng bước

```
Bước 1: Người dùng nhập email và mật khẩu
    ↓
Bước 2: Hệ thống kiểm tra thông tin
    ↓
Bước 3: Kiểm tra email đã xác thực chưa
    ↓
Bước 4: Tạo phiên đăng nhập (Session)
    ↓
Bước 5: Trả về mã truy cập (Access Token)
```

### Chi tiết từng bước

#### Bước 1: Nhập thông tin

Người dùng cung cấp:

- **Email**: Địa chỉ email đã đăng ký
- **Mật khẩu**: Mật khẩu của tài khoản

#### Bước 2: Kiểm tra thông tin đăng nhập

Hệ thống sẽ kiểm tra:

- ✅ Email có tồn tại trong hệ thống không?
- ✅ Mật khẩu có đúng không?
- ✅ Tài khoản có bị khóa không?

**Các trường hợp bị từ chối:**

- ❌ Email không tồn tại → "Email hoặc mật khẩu không đúng"
- ❌ Mật khẩu sai → "Email hoặc mật khẩu không đúng"
- ❌ Tài khoản bị khóa → "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ"

**Lưu ý bảo mật:**
Hệ thống không nói rõ "email sai" hay "mật khẩu sai" để tránh kẻ xấu biết được email nào có trong hệ thống.

#### Bước 3: Kiểm tra xác thực email

Sau khi thông tin đúng, hệ thống kiểm tra:

- ✅ Email đã được xác thực chưa?

**Nếu chưa xác thực:**

- ❌ Không cho phép đăng nhập
- Hiển thị: "Vui lòng xác thực email trước khi đăng nhập"
- Cung cấp link để gửi lại email xác thực

**Lý do cần xác thực:**

- Đảm bảo email là thật, không phải email ảo
- Có thể gửi thông báo quan trọng cho người dùng
- Bảo vệ tài khoản khỏi bị chiếm đoạt

#### Bước 4: Tạo phiên đăng nhập

Khi đăng nhập thành công, hệ thống tạo một **phiên làm việc** (Session):

**Thông tin phiên gồm:**

- Mã phiên duy nhất
- Thời gian hết hạn
- Thông tin thiết bị (tên điện thoại, máy tính)
- Địa chỉ IP
- Thời gian đăng nhập

**Mục đích:**

- Theo dõi các thiết bị đã đăng nhập
- Cho phép người dùng đăng xuất từ xa
- Phát hiện hoạt động bất thường

#### Bước 5: Trả về mã truy cập

Hệ thống trả về 2 loại mã:

**1. Access Token (Mã truy cập)**

- Thời gian sống: **15 phút**
- Dùng để gọi các chức năng của hệ thống
- Hết hạn nhanh để bảo mật cao

**2. Refresh Token (Mã làm mới)**

- Thời gian sống: **7 ngày**
- Dùng để lấy Access Token mới khi hết hạn
- Giúp người dùng không phải đăng nhập lại liên tục

### Cơ chế Duy trì Đăng nhập

```
Phút thứ 1-15: Dùng Access Token để truy cập
    ↓
Phút thứ 16: Access Token hết hạn
    ↓
Ứng dụng tự động dùng Refresh Token để lấy Access Token mới
    ↓
Tiếp tục sử dụng trong 15 phút tiếp theo
    ↓
Lặp lại cho đến khi Refresh Token hết hạn (7 ngày)
    ↓
Sau 7 ngày: Phải đăng nhập lại
```

**Lợi ích:**

- Người dùng không cần đăng nhập lại trong 7 ngày
- Nếu Access Token bị đánh cắp, chỉ sử dụng được 15 phút
- Cân bằng giữa tiện lợi và bảo mật

## Phương thức 2: Đăng nhập Google

### Quy trình nhanh

```
Bước 1: Click "Đăng nhập bằng Google"
    ↓
Bước 2: Chọn tài khoản Google
    ↓
Bước 3: Google xác nhận danh tính
    ↓
Bước 4: Tự động đăng nhập vào Mimkat
```

### Ưu điểm

✅ **Nhanh chóng**: Chỉ 1-2 click

✅ **An toàn**: Dùng bảo mật của Google

✅ **Không cần nhớ mật khẩu**: Google quản lý thay bạn

✅ **Xác thực 2 lớp**: Nếu bật trên Google, bạn được bảo vệ tốt hơn

## Đăng nhập từ Nhiều Thiết bị

Mimkat cho phép đăng nhập đồng thời trên nhiều thiết bị:

### Ví dụ thực tế

Bạn có thể đăng nhập cùng lúc trên:

- 📱 Điện thoại iPhone
- 💻 Laptop MacBook
- 🖥️ Máy tính văn phòng
- 📲 iPad

**Tổng cộng: KHÔNG GIỚI HẠN thiết bị**

### Quản lý thiết bị

Bạn có thể xem danh sách tất cả thiết bị đã đăng nhập:

- Tên thiết bị (VD: "iPhone của Tuấn")
- Loại thiết bị (Điện thoại/Máy tính/Máy tính bảng)
- Địa chỉ IP
- Thời gian đăng nhập lần cuối

**Chức năng:**

- ✅ Xem tất cả thiết bị đang đăng nhập
- ✅ Đăng xuất từ thiết bị cụ thể
- ✅ Đăng xuất tất cả thiết bị (trừ thiết bị hiện tại)

## Giới hạn Đăng nhập

Để bảo vệ tài khoản khỏi bị tấn công:

**Giới hạn số lần thử:**

- Tối đa **10 lần đăng nhập** trong **15 phút**
- Nếu vượt quá → Tạm khóa 15 phút

**Mục đích:**

- Ngăn chặn kẻ xấu thử nhiều mật khẩu
- Bảo vệ tài khoản người dùng
- Giảm tải hệ thống

## Chức năng "Ghi nhớ đăng nhập"

### Không chọn "Ghi nhớ"

- Đăng nhập có hiệu lực: **7 ngày**
- Sau 7 ngày phải đăng nhập lại

### Có chọn "Ghi nhớ"

- Đăng nhập có hiệu lực: **30 ngày**
- Sau 30 ngày phải đăng nhập lại

**Khuyến nghị:**

- ✅ Chọn "Ghi nhớ" trên thiết bị cá nhân
- ❌ KHÔNG chọn "Ghi nhớ" trên máy chung, máy công cộng

## Tính năng Bảo mật Nâng cao

### 1. Phát hiện đăng nhập bất thường

Hệ thống sẽ cảnh báo khi phát hiện:

- Đăng nhập từ địa điểm lạ (VD: Bình thường ở Hà Nội, đột nhiên đăng nhập từ Đức)
- Đăng nhập từ nhiều thiết bị cùng lúc
- Nhiều lần đăng nhập thất bại

**Hành động:**

- Gửi email cảnh báo
- Yêu cầu xác thực bổ sung
- Khóa tạm thời nếu nghi ngờ cao

### 2. Thông báo đăng nhập mới

Mỗi khi đăng nhập thành công từ thiết bị mới:

- ✉️ Gửi email thông báo
- 📱 Hiển thị thiết bị và địa điểm
- 🔒 Cung cấp link "Không phải tôi" để khóa tài khoản ngay

### 3. Tự động đăng xuất khi không hoạt động

**Trường hợp 1: Trên Web**

- Không hoạt động sau **30 phút** → Tự động đăng xuất
- Mục đích: Bảo vệ khi quên không đăng xuất

**Trường hợp 2: Trên Mobile**

- Giữ đăng nhập cho đến khi hết hạn token
- Mục đích: Tiện lợi sử dụng trên điện thoại

## Xử lý Quên Mật khẩu

### Quy trình khôi phục

```
Bước 1: Click "Quên mật khẩu"
    ↓
Bước 2: Nhập email đã đăng ký
    ↓
Bước 3: Nhận email với link đặt lại mật khẩu
    ↓
Bước 4: Click link và nhập mật khẩu mới
    ↓
Bước 5: Đăng nhập với mật khẩu mới
```

**Bảo mật:**

- Link đặt lại mật khẩu có hiệu lực: **1 giờ**
- Mỗi link chỉ sử dụng được **1 lần**
- Sau khi đổi mật khẩu, tất cả phiên đăng nhập cũ bị hủy

## Trường hợp Đặc biệt

### Trường hợp 1: Đăng nhập thất bại nhiều lần

**Nguyên nhân:**

- Nhập sai mật khẩu nhiều lần
- Có người đang cố đăng nhập vào tài khoản

**Hành động hệ thống:**

- Tạm khóa đăng nhập 15 phút
- Gửi email cảnh báo
- Đề xuất đổi mật khẩu nếu không phải bạn

### Trường hợp 2: Phiên đăng nhập hết hạn

**Triệu chứng:**

- Đang sử dụng, đột nhiên bị yêu cầu đăng nhập lại

**Nguyên nhân:**

- Refresh Token đã hết hạn (sau 7 ngày)
- Bạn đã đăng xuất từ thiết bị khác
- Bạn đã đổi mật khẩu

**Giải pháp:**

- Đăng nhập lại là xong

### Trường hợp 3: Tài khoản Google và Email riêng biệt

**Tình huống:**

- Có 2 tài khoản với cùng email:
  - Tài khoản A: Đăng ký bằng email
  - Tài khoản B: Đăng ký bằng Google

**Hiện tại:**

- Đây là 2 tài khoản hoàn toàn riêng biệt
- Không thể merge (gộp) lại

**Khuyến nghị:**

- Chọn 1 trong 2 để sử dụng chính
- Liên hệ hỗ trợ để xóa tài khoản không dùng

## Quy trình Xử lý Lỗi

| Tình huống          | Thông báo                                                | Giải pháp                              |
| ------------------- | -------------------------------------------------------- | -------------------------------------- |
| Email/Mật khẩu sai  | "Email hoặc mật khẩu không đúng"                         | Kiểm tra lại hoặc dùng "Quên mật khẩu" |
| Email chưa xác thực | "Vui lòng xác thực email trước khi đăng nhập"            | Click link trong email hoặc gửi lại    |
| Tài khoản bị khóa   | "Tài khoản đã bị khóa. Liên hệ hỗ trợ"                   | Liên hệ team hỗ trợ                    |
| Vượt giới hạn thử   | "Quá nhiều lần đăng nhập thất bại. Vui lòng đợi 15 phút" | Chờ 15 phút hoặc đổi mật khẩu          |
| Lỗi hệ thống        | "Đã có lỗi xảy ra. Vui lòng thử lại"                     | Thử lại sau vài phút                   |

## Mẹo Sử dụng

✅ **Dùng mật khẩu mạnh**: Kết hợp chữ, số, ký tự đặc biệt

✅ **Không dùng chung mật khẩu**: Mỗi trang web một mật khẩu riêng

✅ **Bật xác thực 2 lớp** (khi có): Thêm lớp bảo mật

✅ **Kiểm tra thiết bị đăng nhập**: Định kỳ xem có thiết bị lạ không

✅ **Đăng xuất trên máy công cộng**: Luôn nhớ đăng xuất

❌ **Không chia sẻ mật khẩu**: Kể cả với bạn bè

❌ **Không lưu mật khẩu ở nơi dễ thấy**: VD: ghi trên giấy note dán màn hình

---

**Tài liệu liên quan:**

- [Quy trình Đăng ký và Xác thực](01-dang-ky-va-xac-thuc.md)
- [Quản lý Phiên Đăng nhập](03-quan-ly-phien.md)
- [Bảo mật và Quyền riêng tư](04-bao-mat.md)
