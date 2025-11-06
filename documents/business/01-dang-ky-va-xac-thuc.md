# Quy trình Đăng ký và Xác thực Tài khoản

## Tổng quan

Khi người dùng muốn sử dụng Mimkat, họ cần tạo một tài khoản. Hệ thống cung cấp 2 phương thức đăng ký:

1. **Đăng ký bằng Email** - Tự tạo tài khoản với email và mật khẩu
2. **Đăng ký bằng Google** - Sử dụng tài khoản Google có sẵn

## Phương thức 1: Đăng ký bằng Email

### Quy trình từng bước

```
Bước 1: Người dùng điền thông tin
    ↓
Bước 2: Hệ thống kiểm tra email có tồn tại chưa
    ↓
Bước 3: Tạo tài khoản và gửi email xác thực
    ↓
Bước 4: Người dùng nhận email và click link xác thực
    ↓
Bước 5: Tài khoản được kích hoạt
```

### Chi tiết từng bước

#### Bước 1: Người dùng điền thông tin

Người dùng cần cung cấp:

- **Email**: Địa chỉ email hợp lệ (VD: nguoidung@gmail.com)
- **Mật khẩu**: Ít nhất 8 ký tự

**Yêu cầu mật khẩu:**

- Độ dài tối thiểu: 8 ký tự
- Nên bao gồm: chữ hoa, chữ thường, số, ký tự đặc biệt
- Không dùng mật khẩu quá đơn giản (VD: 12345678, password123)

#### Bước 2: Hệ thống kiểm tra

Hệ thống sẽ kiểm tra:

- ✅ Email có đúng định dạng không?
- ✅ Email đã được đăng ký chưa?
- ✅ Mật khẩu có đủ mạnh không?

**Trường hợp bị từ chối:**

- ❌ Email đã tồn tại → Hiển thị thông báo "Email này đã được sử dụng"
- ❌ Email không hợp lệ → Hiển thị "Vui lòng nhập email hợp lệ"
- ❌ Mật khẩu quá ngắn → Hiển thị "Mật khẩu phải có ít nhất 8 ký tự"

#### Bước 3: Tạo tài khoản

Khi thông tin hợp lệ, hệ thống sẽ:

1. **Mã hóa mật khẩu** - Mật khẩu được bảo vệ bằng công nghệ mã hóa cao cấp
2. **Tạo mã xác thực** - Một mã bảo mật ngẫu nhiên được tạo ra
3. **Lưu thông tin** - Lưu vào cơ sở dữ liệu
4. **Gửi email xác thực** - Gửi email chứa link kích hoạt tài khoản

**Thông tin email xác thực:**

- Link xác thực có hiệu lực: **48 giờ**
- Sau 48 giờ, người dùng cần yêu cầu gửi lại email mới

#### Bước 4: Xác thực Email

Người dùng mở email và click vào link xác thực. Khi click:

- Hệ thống kiểm tra mã xác thực có hợp lệ không
- Kiểm tra mã có hết hạn chưa
- Nếu hợp lệ → Kích hoạt tài khoản
- Nếu hết hạn → Hiển thị thông báo và cho phép gửi lại email

#### Bước 5: Tài khoản được kích hoạt

✅ Tài khoản đã sẵn sàng sử dụng
✅ Người dùng có thể đăng nhập vào hệ thống

## Phương thức 2: Đăng ký bằng Google

### Quy trình nhanh

```
Bước 1: Người dùng click "Đăng nhập bằng Google"
    ↓
Bước 2: Chuyển đến trang đăng nhập Google
    ↓
Bước 3: Người dùng chọn tài khoản Google
    ↓
Bước 4: Google xác nhận và gửi thông tin về Mimkat
    ↓
Bước 5: Tự động tạo tài khoản và đăng nhập
```

### Ưu điểm của đăng nhập Google

✅ **Nhanh chóng**: Không cần điền form đăng ký

✅ **Bỏ qua xác thực email**: Vì Google đã xác thực email rồi

✅ **An toàn**: Không cần tạo mật khẩu mới, dùng bảo mật của Google

✅ **Tiện lợi**: Một click là xong

### Thông tin được lấy từ Google

Khi đăng ký bằng Google, Mimkat sẽ nhận:

- Email của bạn
- Tên đầy đủ
- Ảnh đại diện
- Google ID (mã định danh duy nhất)

**Lưu ý bảo mật:**

- Mimkat KHÔNG nhận được mật khẩu Google của bạn
- Mimkat chỉ nhận thông tin cơ bản với sự đồng ý của bạn
- Bạn có thể thu hồi quyền truy cập bất cứ lúc nào từ cài đặt Google

## Giới hạn Đăng ký

Để chống spam và lạm dụng, hệ thống có giới hạn:

**Đăng ký bằng Email:**

- Tối đa **5 lần đăng ký** trong **15 phút**
- Nếu vượt quá → Phải đợi 15 phút mới thử lại

**Mục đích:**

- Ngăn chặn người dùng tạo nhiều tài khoản ảo
- Bảo vệ hệ thống khỏi tấn công tự động
- Đảm bảo chất lượng dịch vụ cho người dùng thật

## Trường hợp Đặc biệt

### Trường hợp 1: Không nhận được email xác thực

**Nguyên nhân có thể:**

- Email bị vào thư mục Spam/Junk
- Email bị chặn bởi hệ thống mail
- Địa chỉ email nhập sai

**Giải pháp:**

1. Kiểm tra thư mục Spam/Junk
2. Thêm email của Mimkat vào danh sách tin cậy
3. Yêu cầu gửi lại email xác thực
4. Liên hệ bộ phận hỗ trợ nếu vẫn không nhận được

### Trường hợp 2: Link xác thực hết hạn

**Giải pháp:**

1. Truy cập trang đăng nhập
2. Click vào "Gửi lại email xác thực"
3. Nhập email đã đăng ký
4. Nhận email mới và xác thực trong 48 giờ

### Trường hợp 3: Đã có tài khoản email, muốn liên kết Google

**Hiện tại:**

- Chưa hỗ trợ liên kết nhiều phương thức đăng nhập
- Mỗi email chỉ được dùng cho 1 phương thức

**Tương lai:**

- Sẽ hỗ trợ liên kết nhiều phương thức đăng nhập
- Người dùng có thể chọn phương thức đăng nhập ưa thích

## Quy trình Xử lý Lỗi

| Tình huống            | Thông báo cho người dùng                                             | Hành động tiếp theo                        |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| Email đã tồn tại      | "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác" | Chuyển sang trang đăng nhập hoặc đổi email |
| Mật khẩu quá yếu      | "Mật khẩu phải có ít nhất 8 ký tự"                                   | Nhập lại mật khẩu mạnh hơn                 |
| Email không hợp lệ    | "Vui lòng nhập địa chỉ email hợp lệ"                                 | Sửa lại định dạng email                    |
| Vượt giới hạn đăng ký | "Bạn đã thử quá nhiều lần. Vui lòng đợi 15 phút"                     | Chờ 15 phút rồi thử lại                    |
| Lỗi hệ thống          | "Đã có lỗi xảy ra. Vui lòng thử lại sau"                             | Thử lại sau vài phút                       |

## Thống kê và Theo dõi

Hệ thống ghi nhận các thông tin sau (để cải thiện dịch vụ):

- Số lượng đăng ký thành công/thất bại mỗi ngày
- Tỷ lệ xác thực email thành công
- Thời gian trung bình từ đăng ký đến xác thực
- Phương thức đăng ký được ưa chuộng (Email vs Google)

**Lưu ý:** Đây chỉ là số liệu thống kê, không liên quan đến thông tin cá nhân.

---

**Tài liệu liên quan:**

- [Quy trình Đăng nhập](02-dang-nhap.md)
- [Bảo mật và Quyền riêng tư](04-bao-mat.md)
- [Hệ thống Thông báo Email](05-thong-bao-email.md)
