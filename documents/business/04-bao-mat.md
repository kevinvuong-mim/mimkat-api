# Bảo mật và Quyền riêng tư

## Cam kết của Mimkat

Mimkat coi trọng **bảo mật thông tin** và **quyền riêng tư** của người dùng. Chúng tôi áp dụng các biện pháp bảo vệ hiện đại nhất để giữ an toàn cho dữ liệu của bạn.

## Các Lớp Bảo mật

### Lớp 1: Bảo vệ Mật khẩu

#### Mã hóa Mật khẩu

- **Công nghệ**: Bcrypt với salt rounds = 12
- **Nghĩa là gì?**: Mật khẩu của bạn được "xáo trộn" 12 lần, rất khó để phá
- **Kết quả**: Ngay cả admin hệ thống cũng KHÔNG thể xem mật khẩu gốc của bạn

**Ví dụ:**

```
Mật khẩu bạn nhập: "MyPass123"
Lưu trong database: "$2b$12$KIXx7vZ8..."
→ Không ai có thể đảo ngược để biết mật khẩu gốc
```

#### Yêu cầu Mật khẩu Mạnh

- ✅ Tối thiểu 8 ký tự
- ✅ Nên có: CHỮ HOA, chữ thường, số, ký tự đặc biệt
- ❌ Không được: 12345678, password, qwerty

#### Kiểm tra Mật khẩu Bị rò rỉ

**Tương lai** (đang phát triển):

- Kiểm tra mật khẩu có trong danh sách đã bị hack không
- Cảnh báo người dùng nếu mật khẩu không an toàn
- Yêu cầu đổi mật khẩu mạnh hơn

### Lớp 2: Bảo vệ Token (Chìa khóa truy cập)

#### Access Token (15 phút)

- **Mục đích**: Dùng để truy cập các chức năng
- **Thời gian ngắn**: Nếu bị đánh cắp, chỉ dùng được 15 phút
- **Mã hóa**: Sử dụng JWT (JSON Web Token) được ký số

#### Refresh Token (7 ngày)

- **Mục đích**: Làm mới Access Token
- **Lưu trữ**: Được mã hóa trước khi lưu database
- **Bảo vệ**: Nếu phát hiện sử dụng bất thường → Hủy ngay

#### Cơ chế Phát hiện Token bị đánh cắp

```
Tình huống: Token được dùng từ 2 địa điểm khác nhau
    ↓
Hệ thống phát hiện: "Có gì đó không ổn!"
    ↓
Hành động:
  • Hủy token ngay lập tức
  • Đăng xuất tất cả thiết bị
  • Gửi email cảnh báo
  • Yêu cầu đổi mật khẩu
```

### Lớp 3: Bảo vệ Tài khoản

#### Rate Limiting (Giới hạn số lần thử)

Ngăn chặn tấn công vét cạn mật khẩu:

| Hành động      | Giới hạn | Thời gian |
| -------------- | -------- | --------- |
| Đăng ký        | 5 lần    | 15 phút   |
| Đăng nhập      | 10 lần   | 15 phút   |
| Quên mật khẩu  | 3 lần    | 15 phút   |
| Xác thực email | 5 lần    | 15 phút   |

**Mục đích:**

- Ngăn bot tự động tấn công
- Bảo vệ người dùng thật
- Giảm tải hệ thống

#### Phát hiện Đăng nhập Bất thường

Hệ thống cảnh báo khi:

- 🌍 Đăng nhập từ quốc gia lạ
- 📍 Thay đổi vị trí đột ngột (VD: 10 phút trước ở Hà Nội, giờ ở Mỹ)
- 📱 Thiết bị mới chưa từng dùng
- ⚠️ Nhiều lần đăng nhập thất bại

**Hành động bảo vệ:**

- ✉️ Gửi email cảnh báo ngay
- 🔒 Yêu cầu xác thực bổ sung
- ❌ Tạm khóa nếu nghi ngờ cao

#### Xác thực Email bắt buộc

**Tại sao cần xác thực?**

- ✅ Đảm bảo email là thật, không phải email ảo
- ✅ Có thể gửi cảnh báo bảo mật
- ✅ Khôi phục tài khoản khi quên mật khẩu
- ✅ Giảm tài khoản spam

**Không xác thực thì sao?**

- ❌ Không thể đăng nhập
- ❌ Không nhận thông báo quan trọng
- ❌ Không thể khôi phục tài khoản

### Lớp 4: Bảo vệ Dữ liệu

#### HTTPS - Mã hóa Kết nối

- **Tất cả** kết nối đều được mã hóa
- Dữ liệu truyền từ thiết bị → Server được bảo vệ
- Không ai có thể "nghe lén" được

**Ví dụ:**

```
Không mã hóa: email=abc@gmail.com&password=123456
→ Dễ bị đánh cắp

Có mã hóa: #$%^&*(@!#$%^&*()
→ Không ai đọc được
```

#### CORS - Kiểm soát Truy cập

- Chỉ các trang web được phê duyệt mới gọi API được
- Chặn các trang web lạ cố gắng truy cập
- Bảo vệ khỏi tấn công Cross-Site

#### SQL Injection Prevention

- **Vấn đề**: Kẻ xấu cố nhúng mã độc vào input
- **Giải pháp**: Prisma ORM tự động bảo vệ
- **Kết quả**: An toàn 99.9%

**Ví dụ tấn công (đã bị chặn):**

```
Input: admin' OR '1'='1
→ Prisma tự động escape, không thực thi code độc
```

#### XSS Prevention

- **Vấn đề**: Nhúng JavaScript độc vào input
- **Giải pháp**: Sanitize và validate tất cả input
- **Kết quả**: Code độc không được thực thi

### Lớp 5: Bảo vệ Cơ sở dữ liệu

#### Mã hóa Dữ liệu nhạy cảm

Các dữ liệu được mã hóa:

- ✅ Mật khẩu (Bcrypt)
- ✅ Refresh Token (Bcrypt)
- ✅ Token xác thực email (Bcrypt)

Các dữ liệu KHÔNG mã hóa (không cần):

- Email (cần để tìm kiếm)
- Tên người dùng (thông tin công khai)
- Thông tin thiết bị (cần để hiển thị)

#### Backup Định kỳ

- **Tần suất**: Mỗi ngày
- **Lưu trữ**: Nhiều địa điểm khác nhau
- **Mã hóa**: Backup cũng được mã hóa
- **Mục đích**: Khôi phục nếu có sự cố

#### Phân quyền Database

- Developer: Chỉ đọc dữ liệu (không sửa)
- Admin: Đọc + Sửa (có log đầy đủ)
- Hệ thống: Đọc + Sửa + Xóa (tự động)

**Không ai** có quyền xóa toàn bộ database!

## Quyền riêng tư Dữ liệu

### Chúng tôi Thu thập gì?

#### Thông tin Bắt buộc

- 📧 Email
- 🔑 Mật khẩu (nếu đăng ký bằng email)
- 📱 Thông tin thiết bị (tên, loại, IP)
- 🕐 Thời gian đăng nhập/đăng xuất

#### Thông tin Tùy chọn

- 👤 Tên đầy đủ
- 🖼️ Ảnh đại diện
- 🌍 Vị trí ước tính (dựa trên IP)

#### Thông tin KHÔNG thu thập

- ❌ Danh bạ điện thoại
- ❌ Tin nhắn cá nhân
- ❌ Vị trí GPS chính xác
- ❌ Thông tin thẻ tín dụng

### Chúng tôi Dùng dữ liệu để làm gì?

#### Mục đích Chính

1. **Cung cấp dịch vụ**: Đăng nhập, quản lý công việc
2. **Bảo mật tài khoản**: Phát hiện hoạt động bất thường
3. **Cải thiện trải nghiệm**: Sửa lỗi, thêm tính năng
4. **Hỗ trợ khách hàng**: Giải đáp thắc mắc

#### Chúng tôi KHÔNG bao giờ:

- ❌ Bán dữ liệu cho bên thứ 3
- ❌ Gửi spam quảng cáo
- ❌ Chia sẻ thông tin cá nhân
- ❌ Theo dõi hành vi ngoài ứng dụng

### Quyền của Người dùng

#### Quyền Xem

- ✅ Xem tất cả dữ liệu cá nhân
- ✅ Xuất dữ liệu ra file

#### Quyền Sửa

- ✅ Sửa tên, ảnh đại diện
- ✅ Đổi email (cần xác thực lại)
- ✅ Đổi mật khẩu

#### Quyền Xóa

- ✅ Xóa tài khoản bất cứ lúc nào
- ✅ Dữ liệu sẽ bị xóa vĩnh viễn sau 30 ngày
- ⚠️ Không thể khôi phục sau khi xóa

#### Quyền Phản đối

- ✅ Từ chối nhận email marketing (nếu có)
- ✅ Yêu cầu xóa dữ liệu không cần thiết

### Chia sẻ Dữ liệu với Bên thứ 3

#### Có chia sẻ không?

**CÓ** - Nhưng rất hạn chế:

1. **Google** (khi dùng đăng nhập Google)
   - Chỉ xác thực danh tính
   - Không chia sẻ dữ liệu khác

2. **Nhà cung cấp Email** (để gửi email)
   - Chỉ gửi email xác thực/thông báo
   - Không lưu trữ nội dung email

3. **Nhà cung cấp Hosting** (lưu trữ dữ liệu)
   - Dữ liệu được mã hóa
   - Có hợp đồng bảo mật nghiêm ngặt

#### Không chia sẻ với:

- ❌ Công ty quảng cáo
- ❌ Công ty phân tích dữ liệu
- ❌ Mạng xã hội
- ❌ Bất kỳ ai khác

## Bảo mật cho Người dùng

### Mẹo Bảo vệ Tài khoản

#### ✅ NÊN làm

1. **Dùng mật khẩu mạnh**
   - Kết hợp: Chữ HOA, chữ thường, số, ký tự đặc biệt
   - VD: `M!mk@t2024#Secure`

2. **Không dùng chung mật khẩu**
   - Mỗi trang web một mật khẩu riêng
   - Dùng trình quản lý mật khẩu (VD: 1Password, LastPass)

3. **Kiểm tra thiết bị đăng nhập**
   - 1 tháng/lần xem danh sách thiết bị
   - Đăng xuất thiết bị không nhận ra

4. **Đọc email cảnh báo**
   - Phản ứng nhanh khi có thông báo bất thường
   - Đổi mật khẩu ngay nếu nghi ngờ

5. **Cập nhật thông tin liên hệ**
   - Đảm bảo email còn hoạt động
   - Có thể nhận cảnh báo bảo mật

#### ❌ KHÔNG NÊN làm

1. **Chia sẻ mật khẩu**
   - Kể cả với bạn bè, gia đình
   - Mimkat không bao giờ hỏi mật khẩu qua email/điện thoại

2. **Dùng WiFi công cộng không bảo mật**
   - Dễ bị đánh cắp thông tin
   - Nếu bắt buộc phải dùng → Dùng VPN

3. **Click vào link lạ trong email**
   - Có thể là email lừa đảo (phishing)
   - Luôn kiểm tra địa chỉ email gửi

4. **Lưu mật khẩu ở nơi dễ thấy**
   - Không ghi trên giấy note dán màn hình
   - Không lưu trong file không mã hóa

5. **Bỏ qua cập nhật bảo mật**
   - Luôn cập nhật app lên phiên bản mới nhất
   - Các bản vá bảo mật rất quan trọng

### Nhận biết Lừa đảo (Phishing)

#### Dấu hiệu Email lừa đảo:

⚠️ **Nghi ngờ nếu email có:**

- Địa chỉ gửi lạ (VD: `support@mimkat-verify.com` thay vì `noreply@mimkat.com`)
- Yêu cầu cấp bách: "Xác nhận ngay trong 1 giờ!"
- Lỗi chính tả, ngữ pháp kém
- Link dẫn đến trang web lạ
- Yêu cầu cung cấp mật khẩu

✅ **Email thật từ Mimkat:**

- Địa chỉ: `noreply@mimkat.com` hoặc `support@mimkat.com`
- Không bao giờ hỏi mật khẩu
- Ngôn ngữ chuyên nghiệp, rõ ràng
- Link dẫn đến `mimkat.com`

#### Nếu nghi ngờ:

1. ❌ Đừng click vào link
2. 📧 Liên hệ trực tiếp với support
3. 🔍 Kiểm tra từ cài đặt tài khoản thay vì từ email
4. 📞 Gọi hotline nếu khẩn cấp

## Chính sách Bảo mật Nâng cao

### Xác thực 2 lớp (2FA)

**Trạng thái**: Đang phát triển

**Tương lai:**

- Sử dụng app Authenticator (Google, Microsoft)
- Mã OTP qua SMS
- Bảo mật email khi đăng nhập

**Lợi ích:**

- Ngay cả khi mất mật khẩu, tài khoản vẫn an toàn
- Cần cả mật khẩu + mã OTP mới đăng nhập được

### Đăng nhập Sinh trắc học

**Trạng thái**: Kế hoạch dài hạn

**Tương lai:**

- Face ID / Touch ID trên mobile
- Windows Hello trên PC
- Đăng nhập nhanh và an toàn

### Cảnh báo Bảo mật Chủ động

**Trạng thái**: Đang hoàn thiện

**Tính năng:**

- Quét định kỳ hoạt động bất thường
- Thông báo push khi đăng nhập mới
- Dashboard bảo mật với điểm số an toàn

## Tuân thủ Pháp luật

### GDPR (EU)

Mimkat tuân thủ các quy định:

- ✅ Quyền được biết dữ liệu gì được thu thập
- ✅ Quyền xóa dữ liệu ("Right to be forgotten")
- ✅ Quyền xuất dữ liệu
- ✅ Thông báo vi phạm trong 72 giờ

### Luật An toàn thông tin Việt Nam

- ✅ Lưu trữ dữ liệu người dùng Việt Nam tại Việt Nam
- ✅ Bảo vệ thông tin cá nhân theo Nghị định 13/2023
- ✅ Báo cáo định kỳ với cơ quan chức năng

### ISO 27001 (Mục tiêu)

Mimkat đang hướng đến chứng nhận:

- Quản lý bảo mật thông tin chuẩn quốc tế
- Kiểm toán bảo mật định kỳ
- Đào tạo nhân viên về bảo mật

## Xử lý Sự cố Bảo mật

### Nếu phát hiện lỗ hổng bảo mật

**Người dùng phát hiện:**

1. 📧 Email ngay: security@mimkat.com
2. 📝 Mô tả chi tiết vấn đề
3. 🎁 Có thể nhận phần thưởng (Bug Bounty)

**Chúng tôi cam kết:**

- Phản hồi trong 24 giờ
- Sửa lỗi nghiêm trọng trong 72 giờ
- Thông báo công khai sau khi đã vá lỗi

### Nếu dữ liệu bị rò rỉ

**Quy trình:**

1. ⚠️ Phát hiện và ngăn chặn ngay
2. 🔍 Điều tra phạm vi ảnh hưởng
3. 📧 Thông báo người dùng bị ảnh hưởng trong 24-72 giờ
4. 🔧 Sửa lỗi và tăng cường bảo mật
5. 📊 Báo cáo công khai sau khi xử lý xong

**Người dùng bị ảnh hưởng:**

- Được thông báo qua email
- Hướng dẫn các bước bảo vệ
- Hỗ trợ đổi mật khẩu, khôi phục tài khoản
- Bồi thường nếu có thiệt hại

## Liên hệ về Bảo mật

### Báo cáo lỗ hổng bảo mật:

📧 Email: security@mimkat.com

### Thắc mắc về quyền riêng tư:

📧 Email: privacy@mimkat.com

### Yêu cầu xóa dữ liệu:

📧 Email: dataprotection@mimkat.com

### Hotline khẩn cấp:

📞 Đang cập nhật

---

**Tài liệu liên quan:**

- [Quy trình Đăng ký và Xác thực](01-dang-ky-va-xac-thuc.md)
- [Quy trình Đăng nhập](02-dang-nhap.md)
- [Quản lý Phiên Đăng nhập](03-quan-ly-phien.md)
- [FAQ - Câu hỏi thường gặp](06-faq.md)

_Cập nhật lần cuối: Tháng 11, 2025_
