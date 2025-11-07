# Hệ thống Thông báo Email

## Tổng quan

Mimkat sử dụng email để giao tiếp với người dùng về các sự kiện quan trọng. Email giúp:

- ✅ Xác thực tài khoản mới
- ✅ Khôi phục mật khẩu
- ✅ Cảnh báo bảo mật
- ✅ Thông báo cập nhật quan trọng

## Các loại Email

### 1. Email Xác thực Tài khoản

#### Khi nào nhận?

- Ngay sau khi đăng ký tài khoản mới bằng email

#### Nội dung:

```
Tiêu đề: [Mimkat] Xác thực email của bạn

Xin chào,

Cảm ơn bạn đã đăng ký tài khoản Mimkat!

Vui lòng click vào link dưới đây để xác thực email của bạn:

[Xác thực email]

Link có hiệu lực trong 48 giờ.

Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.

---
Mimkat Team
```

#### Thông tin quan trọng:

- **Thời gian có hiệu lực**: 48 giờ
- **Số lần sử dụng**: 1 lần duy nhất
- **Nếu hết hạn**: Yêu cầu gửi lại email mới

#### Không nhận được email?

**Kiểm tra:**

1. 📁 Thư mục Spam/Junk
2. 📧 Email có đúng không?
3. ⏳ Đợi vài phút (có thể bị delay)

**Giải pháp:**

1. Thêm `noreply@mimkat.com` vào danh sách tin cậy
2. Yêu cầu gửi lại email từ trang đăng nhập
3. Liên hệ hỗ trợ nếu vẫn không nhận được

### 2. Email Khôi phục Mật khẩu

#### Khi nào nhận?

- Khi bạn click "Quên mật khẩu" và nhập email

#### Nội dung:

```
Tiêu đề: [Mimkat] Đặt lại mật khẩu

Xin chào,

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Click vào link dưới đây để tạo mật khẩu mới:

[Đặt lại mật khẩu]

Link có hiệu lực trong 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
Tài khoản của bạn vẫn an toàn.

---
Mimkat Team
```

#### Thông tin quan trọng:

- **Thời gian có hiệu lực**: 1 giờ
- **Số lần sử dụng**: 1 lần duy nhất
- **Sau khi đổi mật khẩu**: Tất cả phiên đăng nhập cũ bị hủy

#### Bảo mật:

- ✅ Link chỉ gửi đến email đã đăng ký
- ✅ Không có thông tin mật khẩu cũ
- ✅ Phải tạo mật khẩu mới (không thể xem cũ)

**Lưu ý:** Nếu bạn không yêu cầu đặt lại mật khẩu:

- ⚠️ Có thể có người đang cố truy cập tài khoản
- 🔒 Kiểm tra bảo mật tài khoản
- 📧 Liên hệ hỗ trợ nếu nghi ngờ

### 3. Email Cảnh báo Đăng nhập Mới

#### Khi nào nhận?

- Mỗi khi đăng nhập thành công từ thiết bị mới

#### Nội dung:

```
Tiêu đề: [Mimkat] Đăng nhập mới từ thiết bị

Xin chào,

Tài khoản của bạn vừa được đăng nhập từ thiết bị mới:

• Thiết bị: iPhone 13 Pro
• Địa điểm: Hà Nội, Việt Nam
• Thời gian: 06/11/2025, 14:30
• Địa chỉ IP: 116.xxx.xxx.xxx

Nếu đó là bạn, không cần làm gì cả.

Nếu KHÔNG phải bạn, vui lòng:
1. Đổi mật khẩu ngay
2. Click vào link dưới để bảo vệ tài khoản:
   [Không phải tôi - Bảo vệ tài khoản]

---
Mimkat Team
```

#### Mục đích:

- ✅ Thông báo kịp thời hoạt động đăng nhập
- ✅ Cho phép phản ứng nhanh nếu bị xâm nhập
- ✅ Tăng nhận thức về bảo mật

#### Hành động "Không phải tôi":

Khi click vào link, hệ thống sẽ:

1. ❌ Đăng xuất tất cả thiết bị
2. 🔒 Tạm khóa tài khoản
3. 📧 Gửi link đặt lại mật khẩu
4. 🔍 Ghi nhận để điều tra

### 4. Email Cảnh báo Bảo mật

#### Khi nào nhận?

- Phát hiện hoạt động bất thường
- Nhiều lần đăng nhập thất bại
- Thay đổi thông tin quan trọng

#### Ví dụ - Nhiều lần đăng nhập thất bại:

```
Tiêu đề: [Mimkat] Cảnh báo: Nhiều lần đăng nhập thất bại

Xin chào,

Chúng tôi phát hiện nhiều lần đăng nhập thất bại vào tài khoản của bạn:

• Số lần thử: 8 lần
• Thời gian: 06/11/2025, 10:15 - 10:20
• Địa điểm: Hà Nội, Việt Nam
• Địa chỉ IP: 14.xxx.xxx.xxx

Khuyến nghị:
✅ Đổi mật khẩu nếu bạn nghi ngờ ai đó biết mật khẩu
✅ Kiểm tra thiết bị đã đăng nhập
✅ Đảm bảo mật khẩu đủ mạnh

[Đổi mật khẩu ngay] [Xem thiết bị đã đăng nhập]

---
Mimkat Team
```

#### Ví dụ - Đổi email:

```
Tiêu đề: [Mimkat] Xác nhận thay đổi email

Xin chào,

Có yêu cầu thay đổi email tài khoản từ:
• Email cũ: old@gmail.com
• Email mới: new@gmail.com

Vui lòng xác nhận bằng cách click vào link:
[Xác nhận thay đổi]

Link có hiệu lực trong 1 giờ.

Nếu bạn không thực hiện thay đổi này, vui lòng bỏ qua email.

---
Mimkat Team
```

### 5. Email Thông báo Chung

#### Các loại thông báo:

**A. Cập nhật Hệ thống**

- Tính năng mới
- Bảo trì hệ thống
- Nâng cấp quan trọng

**B. Thông báo Điều khoản**

- Thay đổi Điều khoản Sử dụng
- Cập nhật Chính sách Bảo mật
- Thay đổi Giá cả (nếu có)

**C. Khảo sát Người dùng**

- Thu thập ý kiến
- Cải thiện dịch vụ
- Phát triển tính năng mới

**Tần suất:** Tối đa 1-2 email/tháng (không spam)

## Cấu trúc Email chuẩn

### Phần Header

```
Từ: Mimkat <noreply@mimkat.com>
Trả lời: support@mimkat.com (nếu cần phản hồi)
Tiêu đề: [Mimkat] + Nội dung ngắn gọn
```

### Phần Body

1. **Lời chào**: "Xin chào," hoặc "Xin chào [Tên],"
2. **Nội dung chính**: Rõ ràng, súc tích
3. **Call-to-Action**: Button hoặc link (nếu cần)
4. **Thông tin bổ sung**: Ghi chú, lưu ý
5. **Chữ ký**: "Mimkat Team" hoặc "Đội ngũ Mimkat"

### Phần Footer

```
---
© 2025 Mimkat. All rights reserved.

Bạn nhận email này vì có tài khoản tại Mimkat.
Không thể unsubscribe email bảo mật và xác thực.

Có câu hỏi? Liên hệ: support@mimkat.com
```

## Quản lý Email

### Email nào có thể tắt?

#### ✅ CÓ THỂ TẮT:

- Email thông báo tính năng mới
- Email khảo sát người dùng
- Email tips & tricks
- Email marketing (nếu có)

#### ❌ KHÔNG THỂ TẮT:

- Email xác thực tài khoản
- Email đặt lại mật khẩu
- Email cảnh báo bảo mật
- Email thay đổi thông tin quan trọng

**Lý do:** Các email này cần thiết cho bảo mật và hoạt động của tài khoản.

### Cách quản lý Email

**Từ Cài đặt:**

1. Đăng nhập → Cài đặt
2. Chọn "Thông báo"
3. Bật/Tắt từng loại email

**Từ Email:**

- Click link "Unsubscribe" ở cuối email
- Chỉ áp dụng cho email marketing/thông báo chung

## Bảo mật Email

### Nhận biết Email thật/giả

#### ✅ Email THẬT từ Mimkat:

**Địa chỉ gửi:**

- `noreply@mimkat.com`
- `support@mimkat.com`
- `security@mimkat.com`

**Đặc điểm:**

- Logo Mimkat rõ ràng
- Ngôn ngữ chuyên nghiệp
- Link dẫn đến `*.mimkat.com`
- Không yêu cầu mật khẩu trong email

#### ❌ Email GIẢ (Phishing):

**Dấu hiệu:**

- Địa chỉ lạ: `support@mimkat-verify.com`, `noreply@mimkatsystem.com`
- Lỗi chính tả, ngữ pháp
- Link dẫn đến trang web lạ
- Yêu cầu cấp bách "Xác nhận ngay trong 1 giờ!"
- Hỏi mật khẩu qua email

**Nếu nghi ngờ:**

1. ❌ ĐỪNG click vào link
2. 🔍 Kiểm tra địa chỉ email gửi
3. 📧 Liên hệ support@mimkat.com để xác nhận
4. 🚫 Báo cáo email lừa đảo

### SPF, DKIM, DMARC

**Công nghệ bảo vệ:**
Mimkat sử dụng các chuẩn bảo mật email:

- **SPF**: Xác thực server gửi email
- **DKIM**: Ký số điện tử cho email
- **DMARC**: Chống giả mạo email

**Lợi ích cho người dùng:**

- ✅ Email từ Mimkat ít bị vào Spam
- ✅ Khó bị giả mạo
- ✅ Đảm bảo tính toàn vẹn nội dung

## Xử lý Sự cố Email

### Sự cố 1: Không nhận được Email

**Kiểm tra:**

1. 📁 Thư mục Spam/Junk/Quarantine
2. 📧 Địa chỉ email có đúng không?
3. 📥 Hộp thư có đầy không?
4. 🚫 Có bộ lọc email chặn không?

**Giải pháp:**

1. Thêm `noreply@mimkat.com` vào danh sách tin cậy
2. Thêm rule không đưa email từ Mimkat vào spam
3. Yêu cầu gửi lại email
4. Thử email khác nếu vẫn không được

### Sự cố 2: Email đến chậm

**Nguyên nhân:**

- Hệ thống mail bị tải
- Server email đang xử lý nhiều
- Kết nối mạng chậm

**Thời gian chờ bình thường:**

- ✅ Dưới 1 phút: Bình thường
- ⚠️ 1-5 phút: Chấp nhận được
- ❌ Trên 10 phút: Có vấn đề

**Giải pháp:**

- Đợi thêm vài phút
- Kiểm tra spam
- Yêu cầu gửi lại nếu quá 15 phút

### Sự cố 3: Link trong Email hết hạn

**Các link có thời gian sống:**

- Xác thực email: 48 giờ
- Đặt lại mật khẩu: 1 giờ
- Xác nhận thay đổi: 1 giờ

**Khi link hết hạn:**

```
Hiển thị: "Link này đã hết hạn hoặc không hợp lệ"
```

**Giải pháp:**

1. Vào trang tương ứng (đăng nhập, quên mật khẩu...)
2. Yêu cầu gửi email mới
3. Click link mới trong email

**Mẹo:** Xử lý email ngay khi nhận được!

### Sự cố 4: Nhận nhiều Email giống nhau

**Nguyên nhân:**

- Click "Gửi lại" nhiều lần
- Lỗi hệ thống (hiếm)

**Giải pháp:**

- Dùng email mới nhất
- Bỏ qua các email cũ
- Link cũ sẽ không hoạt động sau khi dùng link mới

**Phòng tránh:**

- Chỉ click "Gửi lại" 1 lần
- Đợi ít nhất 2 phút trước khi gửi lại

## Thống kê Email

### Tỷ lệ Gửi thành công

**Mục tiêu:** > 99%

**Theo dõi:**

- Số email gửi thành công
- Số email bị bounce (trả lại)
- Số email vào spam

### Tỷ lệ Mở Email

**Trung bình:** 60-70%

**Cải thiện:**

- Tiêu đề ngắn gọn, hấp dẫn
- Nội dung có giá trị
- Gửi đúng thời điểm

### Tỷ lệ Click

**Trung bình:** 20-30%

**Cải thiện:**

- Button rõ ràng
- Call-to-action mạnh
- Link dễ nhìn

## Tương lai của Hệ thống Email

### Tính năng Đang phát triển

**1. Email cá nhân hóa**

- Xưng hô theo tên người dùng
- Nội dung phù hợp với hành vi

**2. Email responsive**

- Hiển thị tốt trên mọi thiết bị
- Tối ưu cho mobile

**3. Email đa ngôn ngữ**

- Tự động phát hiện ngôn ngữ người dùng
- Hỗ trợ Tiếng Việt, English, và nhiều ngôn ngữ khác

**4. Email templates đẹp hơn**

- Thiết kế hiện đại
- Dễ đọc, dễ hiểu
- Brand identity mạnh mẽ

**5. Thông báo In-App**

- Ngoài email, còn thông báo trong app
- Người dùng chọn kênh ưa thích

## Mẹo Sử dụng Email hiệu quả

### ✅ Nên làm

1. **Kiểm tra email thường xuyên**
   - Đặc biệt sau khi đăng ký, đổi mật khẩu

2. **Thêm vào danh sách tin cậy**
   - Tránh email vào spam

3. **Xử lý ngay**
   - Đặc biệt các email có link (có thời hạn)

4. **Đọc kỹ nội dung**
   - Đừng chỉ click link mà không đọc

5. **Lưu email quan trọng**
   - VD: Email xác nhận, biên nhận

### ❌ Không nên

1. **Bỏ qua email bảo mật**
   - Có thể là cảnh báo quan trọng

2. **Click link không kiểm tra**
   - Có thể là phishing

3. **Reply vào noreply@**
   - Sẽ không ai nhận được

4. **Chia sẻ email chứa link**
   - Link xác thực chỉ dành cho bạn

5. **Để inbox quá đầy**
   - Có thể không nhận được email mới

---

**Tài liệu liên quan:**

- [Quy trình Đăng ký và Xác thực](01-dang-ky-va-xac-thuc.md)
- [Quy trình Đăng nhập](02-dang-nhap.md)
- [Bảo mật và Quyền riêng tư](04-bao-mat.md)
- [FAQ - Câu hỏi thường gặp](06-faq.md)

_Cập nhật lần cuối: Tháng 11, 2025_
