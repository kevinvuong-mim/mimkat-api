# Quy trình Xử lý Dữ liệu

## Tổng quan

Tài liệu này mô tả cách Mimkat thu thập, xử lý, lưu trữ và bảo vệ dữ liệu người dùng. Tất cả được thiết kế với nguyên tắc **Tối thiểu hóa dữ liệu** và **Bảo mật tối đa**.

## Vòng đời Dữ liệu

```
┌──────────────────────────────────────────────────────────┐
│               VÒNG ĐỜI DỮ LIỆU                          │
└──────────────────────────────────────────────────────────┘

1. THU THẬP
   • Người dùng cung cấp khi đăng ký
   • Thu thập tự động (IP, thiết bị)
   ↓

2. XỬ LÝ & VALIDATE
   • Kiểm tra định dạng
   • Mã hóa dữ liệu nhạy cảm
   • Loại bỏ dữ liệu không cần thiết
   ↓

3. LƯU TRỮ
   • Lưu vào database
   • Mã hóa khi lưu
   • Phân quyền truy cập
   ↓

4. SỬ DỤNG
   • Cung cấp dịch vụ
   • Bảo mật tài khoản
   • Cải thiện trải nghiệm
   ↓

5. BACKUP & BẢO QUẢN
   • Backup hàng ngày
   • Lưu trữ đa khu vực
   • Kiểm tra toàn vẹn
   ↓

6. XÓA
   • Theo yêu cầu người dùng
   • Tự động xóa dữ liệu hết hạn
   • Xóa vĩnh viễn sau 30 ngày
```

## Thu thập Dữ liệu

### Dữ liệu Bắt buộc

#### 1. Email

- **Mục đích:** Định danh tài khoản, gửi thông báo, khôi phục mật khẩu
- **Thu thập khi:** Đăng ký
- **Validate:** Phải là email hợp lệ, duy nhất trong hệ thống
- **Có thể sửa:** Có (cần xác thực email mới)
- **Có thể xóa:** Không (cần thiết cho tài khoản)

#### 2. Mật khẩu (nếu đăng ký bằng email)

- **Mục đích:** Xác thực đăng nhập
- **Thu thập khi:** Đăng ký bằng email
- **Validate:** Tối thiểu 8 ký tự
- **Lưu trữ:** Mã hóa Bcrypt, không thể đảo ngược
- **Có thể sửa:** Có (qua "Đổi mật khẩu")
- **Hiển thị:** KHÔNG BAO GIỜ (kể cả admin)

#### 3. Thông tin Thiết bị

**Thu thập tự động:**

- **User Agent:** Trình duyệt, hệ điều hành
- **Địa chỉ IP:** Vị trí ước tính
- **Loại thiết bị:** Phone/Desktop/Tablet
- **Tên thiết bị:** Tự động hoặc người dùng đặt

**Mục đích:**

- Phát hiện hoạt động bất thường
- Quản lý phiên đăng nhập
- Thống kê và cải thiện dịch vụ

### Dữ liệu Tùy chọn

#### 1. Tên đầy đủ

- **Mục đích:** Cá nhân hóa trải nghiệm
- **Mặc định:** Trống hoặc từ Google (nếu dùng Google OAuth)
- **Có thể sửa:** Có
- **Hiển thị:** Chỉ cho người dùng

#### 2. Ảnh đại diện

- **Mục đích:** Nhận diện trực quan
- **Mặc định:** Avatar mặc định hoặc từ Google
- **Có thể sửa:** Có
- **Hiển thị:** Trong giao diện, cho thành viên nhóm (tương lai)

#### 3. Username

- **Mục đích:** Tên hiển thị duy nhất (tương lai)
- **Mặc định:** Trống
- **Validate:** Duy nhất, 3-30 ký tự, không có ký tự đặc biệt
- **Có thể sửa:** Có (giới hạn 1 lần/tháng)

### Dữ liệu KHÔNG thu thập

Mimkat CAM KẾT không thu thập:

- ❌ Danh bạ điện thoại
- ❌ SMS/Tin nhắn
- ❌ Vị trí GPS chính xác
- ❌ Ảnh/Video từ thư viện
- ❌ Thông tin thẻ tín dụng
- ❌ Hoạt động ngoài ứng dụng
- ❌ Dữ liệu từ app khác

## Xử lý Dữ liệu

### Mã hóa Dữ liệu Nhạy cảm

#### Mã hóa Một chiều (Không thể đảo ngược)

**Dùng cho:**

- Mật khẩu
- Refresh Token
- Token xác thực email

**Công nghệ:** Bcrypt với salt rounds = 10-12

**Ví dụ:**

```
Input: "MyPassword123"
Output: "$2b$12$KIXx7vZ8yL9..."
→ Không thể đảo ngược để biết mật khẩu gốc
```

#### Mã hóa Hai chiều (Có thể giải mã)

**Hiện tại:** Chưa áp dụng

**Tương lai:** Có thể dùng cho:

- Dữ liệu nhạy cảm cần hiển thị lại
- Thông tin thanh toán (nếu có)

### Validate Dữ liệu

#### Email

```
Kiểm tra:
✅ Định dạng hợp lệ (regex)
✅ Domain tồn tại (DNS check)
✅ Chưa được sử dụng (unique check)
❌ Email tạm thời/spam (blocklist)
```

#### Mật khẩu

```
Kiểm tra:
✅ Độ dài ≥ 8 ký tự
✅ Không chứa email
✅ Không phải mật khẩu phổ biến (top 10000)
⚠️ Cảnh báo nếu quá yếu
```

#### Input chống XSS

```
Tất cả input được:
✅ Trim (xóa khoảng trắng thừa)
✅ Sanitize (loại bỏ HTML/JavaScript)
✅ Escape (chuyển đổi ký tự đặc biệt)
```

### Làm sạch Dữ liệu

**Tự động xóa:**

- Token xác thực hết hạn (sau 48 giờ)
- Token đặt lại mật khẩu đã dùng
- Phiên đăng nhập hết hạn (sau 7-30 ngày)
- Log cũ (sau 90 ngày)

**Tần suất:** Mỗi ngày lúc 3 giờ sáng

## Lưu trữ Dữ liệu

### Cấu trúc Database

#### Bảng Users (Người dùng)

```
Thông tin lưu trữ:
• id: Mã duy nhất
• email: Email (unique)
• password: Mật khẩu đã mã hóa (nullable)
• username: Tên người dùng (nullable, unique)
• fullName: Tên đầy đủ (nullable)
• avatar: Link ảnh đại diện (nullable)
• provider: "local" hoặc "google"
• googleId: Google ID (nullable, unique)
• isActive: Tài khoản có hoạt động không
• isEmailVerified: Email đã xác thực chưa
• verificationToken: Token xác thực (nullable)
• verificationTokenExpiry: Thời hạn token (nullable)
• createdAt: Thời gian tạo
• updatedAt: Thời gian cập nhật cuối
```

#### Bảng Sessions (Phiên đăng nhập)

```
Thông tin lưu trữ:
• id: Mã duy nhất
• userId: Liên kết với User
• refreshToken: Token làm mới (mã hóa)
• expiresAt: Thời gian hết hạn
• deviceName: Tên thiết bị
• deviceType: Loại thiết bị
• ipAddress: Địa chỉ IP
• userAgent: Thông tin trình duyệt/OS
• lastUsedAt: Lần dùng cuối
• createdAt: Thời gian tạo
```

### Phân quyền Truy cập Database

#### Hệ thống (Application)

```
Quyền:
✅ SELECT (đọc)
✅ INSERT (thêm)
✅ UPDATE (sửa)
✅ DELETE (xóa - có điều kiện)

Giới hạn:
❌ KHÔNG thể DROP table
❌ KHÔNG thể ALTER schema
```

#### Admin/Developer

```
Quyền:
✅ SELECT (đọc) - chỉ dữ liệu không nhạy cảm
⚠️ Không thấy mật khẩu (đã mã hóa)
⚠️ Không thấy token (đã mã hóa)

Giới hạn:
❌ KHÔNG thể UPDATE
❌ KHÔNG thể DELETE
❌ TẤT CẢ hành động được LOG
```

#### Backup System

```
Quyền:
✅ SELECT ALL (đọc toàn bộ)
✅ Chỉ read-only

Bảo mật:
✅ Backup được mã hóa
✅ Lưu trữ tách biệt
```

### Backup & Khôi phục

#### Lịch Backup

**Backup Hàng ngày:**

- Thời gian: 2 giờ sáng (giờ ít traffic)
- Loại: Full backup
- Giữ lại: 30 ngày gần nhất

**Backup Hàng tuần:**

- Thời gian: Chủ nhật, 1 giờ sáng
- Loại: Full backup
- Giữ lại: 12 tuần (3 tháng)

**Backup Hàng tháng:**

- Thời gian: Ngày 1, 0 giờ
- Loại: Full backup
- Giữ lại: 12 tháng (1 năm)

#### Lưu trữ Backup

**Primary Backup:**

- 🌍 Khu vực: Việt Nam
- ☁️ Cloud: AWS S3 hoặc tương tự
- 🔒 Mã hóa: AES-256

**Secondary Backup:**

- 🌍 Khu vực: Singapore
- ☁️ Cloud: Khác provider chính
- 🔒 Mã hóa: AES-256

**Kiểm tra Backup:**

- Tần suất: Hàng tuần
- Phương pháp: Restore test vào database test
- Mục đích: Đảm bảo backup hoạt động

#### Quy trình Khôi phục

**Trường hợp 1: Mất dữ liệu nhỏ (vài record)**

```
Thời gian: < 1 giờ
Quy trình:
1. Xác định dữ liệu bị mất
2. Tìm trong backup gần nhất
3. Restore dữ liệu cụ thể
4. Verify dữ liệu
5. Thông báo người dùng bị ảnh hưởng
```

**Trường hợp 2: Mất dữ liệu lớn (toàn bộ database)**

```
Thời gian: 2-6 giờ
Quy trình:
1. Kích hoạt disaster recovery plan
2. Thông báo người dùng (maintenance mode)
3. Restore từ backup gần nhất
4. Verify toàn bộ dữ liệu
5. Test các chức năng chính
6. Mở lại dịch vụ
7. Post-mortem và cải thiện
```

## Sử dụng Dữ liệu

### Mục đích Chính

#### 1. Cung cấp Dịch vụ (70%)

- Đăng nhập/Đăng xuất
- Quản lý tài khoản
- Lưu trữ công việc (tương lai)
- Đồng bộ dữ liệu

#### 2. Bảo mật (20%)

- Phát hiện hoạt động bất thường
- Ngăn chặn tấn công
- Bảo vệ tài khoản người dùng
- Điều tra sự cố

#### 3. Cải thiện Dịch vụ (10%)

- Thống kê sử dụng
- Phát hiện lỗi
- Tối ưu hiệu suất
- Phát triển tính năng mới

### Chia sẻ với Bên thứ Ba

#### Google (OAuth)

**Khi nào:** Người dùng chọn "Đăng nhập bằng Google"

**Chia sẻ gì:**

- ❌ KHÔNG chia sẻ dữ liệu từ Mimkat cho Google
- ✅ Google chia sẻ cho Mimkat:
  - Email
  - Tên
  - Ảnh đại diện
  - Google ID

**Mục đích:** Chỉ để xác thực

#### Nhà cung cấp Email

**Ai:** SMTP service (Gmail, SendGrid, etc.)

**Chia sẻ gì:**

- Địa chỉ email nhận
- Nội dung email (xác thực, thông báo)

**Mục đích:** Gửi email

**Không chia sẻ:**

- ❌ Mật khẩu
- ❌ Dữ liệu người dùng khác

#### Nhà cung cấp Hosting/Cloud

**Ai:** AWS, Google Cloud, hoặc tương tự

**Chia sẻ gì:**

- Toàn bộ dữ liệu (để lưu trữ)

**Bảo mật:**

- ✅ Dữ liệu được mã hóa
- ✅ Có hợp đồng bảo mật (DPA - Data Processing Agreement)
- ✅ Tuân thủ GDPR, ISO 27001

**Không có quyền:**

- ❌ Không được xem dữ liệu
- ❌ Không được sử dụng cho mục đích khác
- ❌ Không được chia sẻ tiếp

## Xóa Dữ liệu

### Xóa theo Yêu cầu Người dùng

#### Xóa Tài khoản

**Quy trình:**

```
Bước 1: Người dùng yêu cầu xóa
   ↓
Bước 2: Xác nhận mật khẩu
   ↓
Bước 3: Hiển thị cảnh báo về dữ liệu sẽ mất
   ↓
Bước 4: Xác nhận lần cuối
   ↓
Bước 5: Tài khoản bị "soft delete" (đánh dấu xóa)
   • Không thể đăng nhập
   • Dữ liệu vẫn còn trong 30 ngày
   • Có thể khôi phục
   ↓
Bước 6: Sau 30 ngày → "Hard delete" (xóa vĩnh viễn)
   • Xóa tất cả dữ liệu
   • Không thể khôi phục
```

**Dữ liệu được xóa:**

- ✅ Thông tin tài khoản
- ✅ Tất cả phiên đăng nhập
- ✅ Dữ liệu công việc (tương lai)
- ✅ Ảnh đại diện (nếu upload)

**Dữ liệu GIỮ LẠI (theo pháp luật):**

- 📝 Log bảo mật (6 tháng)
- 📝 Log giao dịch thanh toán (nếu có - 7 năm)
- 📝 Dữ liệu liên quan vụ việc pháp lý

**Khôi phục trong 30 ngày:**

1. Liên hệ support@mimkat.com
2. Xác minh danh tính
3. Tài khoản được kích hoạt lại
4. Tất cả dữ liệu được phục hồi

#### Xóa Dữ liệu Cụ thể

**Có thể xóa:**

- ✅ Phiên đăng nhập cụ thể
- ✅ Ảnh đại diện
- ✅ Tên hiển thị (reset về trống)

**Không thể xóa:**

- ❌ Email (cần để định danh)
- ❌ Log bảo mật (cần cho điều tra)
- ❌ Lịch sử đăng nhập (cần cho audit)

### Xóa Tự động

#### Dữ liệu Tạm thời

**Token xác thực email:**

- Thời gian: 48 giờ
- Tự động xóa: Sau khi hết hạn hoặc đã dùng

**Token đặt lại mật khẩu:**

- Thời gian: 1 giờ
- Tự động xóa: Sau khi hết hạn hoặc đã dùng

**Phiên đăng nhập hết hạn:**

- Thời gian: 7-30 ngày
- Tự động xóa: Sau khi hết hạn

#### Log và Thống kê

**Application Log:**

- Giữ lại: 30 ngày
- Tự động xóa: Sau 30 ngày

**Security Log:**

- Giữ lại: 180 ngày (6 tháng)
- Tự động xóa: Sau 6 tháng

**Access Log:**

- Giữ lại: 90 ngày
- Tự động xóa: Sau 90 ngày

## Quyền của Người dùng

### Quyền Truy cập

#### Xem Dữ liệu

```
Người dùng có thể xem:
✅ Tất cả thông tin cá nhân
✅ Lịch sử đăng nhập
✅ Thiết bị đang hoạt động
✅ Log bảo mật (của chính mình)

Cách xem:
Cài đặt → Tài khoản → Dữ liệu của tôi
```

#### Xuất Dữ liệu

```
Định dạng: JSON hoặc CSV
Thời gian xử lý: 24-48 giờ
Gửi qua: Email (file đính kèm hoặc link download)

Cách yêu cầu:
Cài đặt → Dữ liệu & Quyền riêng tư → Xuất dữ liệu
```

### Quyền Sửa đổi

#### Có thể sửa Bất cứ lúc nào:

- ✅ Tên đầy đủ
- ✅ Ảnh đại diện
- ✅ Mật khẩu

#### Có thể sửa Có giới hạn:

- ⚠️ Email (cần xác thực email mới)
- ⚠️ Username (1 lần/tháng)

#### Không thể sửa:

- ❌ Email đã xác thực (phải đổi sang email mới)
- ❌ Provider (local vs google)
- ❌ Google ID

### Quyền Xóa

#### Có thể xóa:

- ✅ Toàn bộ tài khoản
- ✅ Phiên đăng nhập cụ thể
- ✅ Ảnh đại diện

#### Không thể xóa:

- ❌ Email (định danh tài khoản)
- ❌ Log bảo mật (tuân thủ pháp luật)

### Quyền Phản đối

#### Có thể phản đối:

- ✅ Nhận email marketing
- ✅ Sử dụng dữ liệu cho thống kê
- ✅ Hiển thị thông tin công khai (tương lai)

#### Không thể phản đối:

- ❌ Lưu trữ dữ liệu cần thiết cho dịch vụ
- ❌ Email bảo mật
- ❌ Lưu log theo yêu cầu pháp luật

## Tuân thủ Pháp luật

### GDPR (EU General Data Protection Regulation)

✅ **Right to Access:** Người dùng xem được dữ liệu của mình

✅ **Right to Rectification:** Người dùng sửa được dữ liệu sai

✅ **Right to Erasure:** Người dùng xóa được dữ liệu ("Right to be forgotten")

✅ **Right to Data Portability:** Người dùng xuất được dữ liệu

✅ **Right to Object:** Người dùng phản đối xử lý dữ liệu

✅ **Breach Notification:** Thông báo vi phạm trong 72 giờ

### Luật Việt Nam

✅ **Nghị định 13/2023/NĐ-CP:** Bảo vệ dữ liệu cá nhân

✅ **Luật An toàn thông tin mạng 2018**

✅ **Nghị định 85/2016/NĐ-CP:** An toàn thông tin

**Tuân thủ:**

- Lưu trữ dữ liệu người Việt tại Việt Nam
- Báo cáo sự cố bảo mật
- Hợp tác với cơ quan chức năng

---

**Tài liệu liên quan:**

- [Bảo mật và Quyền riêng tư](04-bao-mat.md)
- [FAQ - Câu hỏi thường gặp](06-faq.md)

_Cập nhật lần cuối: Tháng 11, 2025_
