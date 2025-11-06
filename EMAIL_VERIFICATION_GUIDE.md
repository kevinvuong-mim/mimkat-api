# Email Verification & Security Implementation Guide

## Tổng Quan

Hệ thống đã được cập nhật với các tính năng bảo mật sau:

### 1. **Email Verification (Xác thực Email)**
- Người dùng đăng ký bằng email/password PHẢI xác thực email trước khi đăng nhập
- Verification token hết hạn sau 48 giờ
- Tài khoản unverified sẽ tự động bị xóa sau 14 ngày

### 2. **Google OAuth Security**
- Sử dụng Google ID thật (không phải email) để tránh conflict
- Tự động xóa tài khoản unverified khi có người đăng nhập Google với cùng email
- Google accounts được đánh dấu `isEmailVerified: true` tự động

### 3. **Rate Limiting**
- `/auth/register`: 5 requests / 15 phút
- `/auth/login`: 10 requests / 15 phút
- `/auth/resend-verification`: 3 requests / 1 giờ

### 4. **Automated Cleanup (Cron Jobs)**
- **2:00 AM mỗi ngày**: Xóa tài khoản unverified > 14 ngày
- **3:00 AM mỗi ngày**: Xóa expired verification tokens
- **Mỗi giờ**: Xóa expired sessions

---

## Cấu Hình Environment Variables

Cập nhật file `.env` với các thông tin sau:

```env
# Email Service (SMTP)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"  # Gmail App Password (không phải password thường)
MAIL_FROM="noreply@yourapp.com"
APP_URL="http://localhost:3000"
```

### Cách tạo Gmail App Password:

1. Vào [Google Account Security](https://myaccount.google.com/security)
2. Bật "2-Step Verification" nếu chưa có
3. Tìm "App passwords" (Mật khẩu ứng dụng)
4. Chọn "Mail" và "Other (Custom name)"
5. Đặt tên "Mimkat API" và Generate
6. Copy password 16 ký tự vào `MAIL_PASSWORD`

---

## API Endpoints

### 1. Đăng Ký (Register)

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "createdAt": "2025-11-06T10:00:00Z"
  }
}
```

**Note:** Một email xác thực sẽ được gửi đến `user@example.com`

---

### 2. Xác Thực Email

```http
GET /auth/verify-email?token=abc123...
```

**Response:**
```json
{
  "message": "Email verified successfully. You can now log in."
}
```

---

### 3. Gửi Lại Email Xác Thực

```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent successfully"
}
```

**Rate Limit:** 3 requests / 1 giờ

---

### 4. Đăng Nhập

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (Chưa Verify):**
```json
{
  "statusCode": 401,
  "message": "Please verify your email address before logging in. Check your inbox for the verification link."
}
```

---

### 5. Google OAuth Login

**Step 1: Khởi tạo OAuth flow**
```http
GET /auth/google
```
→ Redirect đến Google login page

**Step 2: Google callback**
```http
GET /auth/google/callback
```
→ Tự động xử lý sau khi user đăng nhập Google

**Response:**
```json
{
  "message": "Google login successful",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "fullName": "John Doe",
    "avatar": "https://..."
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

## Flow Bảo Mật Chống Spam Attack

### Kịch Bản: Kẻ tấn công spam đăng ký với email của nạn nhân

**Trước đây:**
```
1. Attacker: POST /auth/register với victim@gmail.com
2. Hệ thống: Tạo tài khoản với password của attacker
3. Victim: Đăng nhập Google với victim@gmail.com
4. ❌ Victim vô tình đăng nhập vào tài khoản giả mạo
```

**Sau khi cập nhật:**
```
1. Attacker: POST /auth/register với victim@gmail.com
2. Hệ thống: Tạo tài khoản với isEmailVerified: false
3. Hệ thống: Gửi email xác thực (attacker không nhận được)
4. Victim: Đăng nhập Google với victim@gmail.com
5. ✅ Hệ thống phát hiện email chưa verify
6. ✅ Tự động XÓA tài khoản giả mạo
7. ✅ Tạo tài khoản mới với Google (isEmailVerified: true)
8. ✅ Victim đăng nhập thành công vào tài khoản thật
```

---

## Database Schema Changes

### User Model

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String?

  // Email verification fields ✨ NEW
  isEmailVerified        Boolean   @default(false)
  verificationToken      String?   @unique
  verificationTokenExpiry DateTime?

  // Google OAuth fields
  googleId  String?   @unique  // ✨ Sử dụng Google ID thật, không phải email
  avatar    String?
  provider  String?   @default("local")

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

---

## Testing Checklist

### ✅ Test Cases

#### 1. Register Flow
- [ ] Đăng ký với email hợp lệ → Nhận email verification
- [ ] Đăng ký với email đã tồn tại → Error 409
- [ ] Spam register 6 lần trong 15 phút → Bị rate limit

#### 2. Email Verification
- [ ] Click link trong email → Account verified
- [ ] Sử dụng expired token (> 48h) → Error
- [ ] Verify 2 lần cùng token → Error lần 2

#### 3. Login Flow
- [ ] Login với unverified account → Error 401
- [ ] Login với verified account → Success
- [ ] Login sai password → Error 401
- [ ] Spam login 11 lần trong 15 phút → Bị rate limit

#### 4. Google OAuth Flow
- [ ] Đăng nhập Google lần đầu → Tạo tài khoản mới
- [ ] Đăng nhập Google với email đã verify → Link Google ID vào account
- [ ] Đăng nhập Google với email unverified → Xóa old account, tạo mới

#### 5. Resend Verification
- [ ] Resend với email unverified → Gửi email mới
- [ ] Resend với email đã verified → Error
- [ ] Spam resend 4 lần trong 1 giờ → Bị rate limit

---

## Troubleshooting

### Email không gửi được

**Kiểm tra:**
1. `.env` có đúng MAIL_* variables chưa?
2. Gmail App Password đã tạo chưa (không dùng password thường)?
3. Gmail "Less secure app access" có bật không? (Không khuyến nghị, dùng App Password)
4. Check logs: `console.error('Failed to send verification email:', error)`

**Test gửi email thủ công:**
```typescript
// Thêm vào controller để test
@Get('test-email')
async testEmail() {
  await this.mailService.sendVerificationEmail(
    'your-test-email@gmail.com',
    'test-token-12345',
    'Test User'
  );
  return { message: 'Email sent' };
}
```

### Rate limit không hoạt động

**Kiểm tra:**
1. ThrottlerModule đã import trong AppModule chưa?
2. ThrottlerGuard đã set là APP_GUARD chưa?
3. Decorator `@Throttle({...})` đã đúng cú pháp chưa?

### Cron job không chạy

**Kiểm tra:**
1. ScheduleModule đã import trong TasksModule chưa?
2. TasksModule đã import trong AppModule chưa?
3. Server có đang chạy không? (Cron chỉ chạy khi server ON)

**Test cron thủ công:**
```bash
# Gọi trực tiếp method từ service
const cleanupService = app.get(CleanupService);
await cleanupService.cleanupUnverified Accounts();
```

---

## Migration Guide

Nếu đã có database production với users, thực hiện:

```bash
# 1. Backup database trước
pg_dump mimkat > backup_$(date +%Y%m%d).sql

# 2. Chạy migration
npx prisma migrate deploy

# 3. Set tất cả existing users là verified (vì họ đã đăng ký trước)
# Chạy SQL sau:
```

```sql
UPDATE users
SET "isEmailVerified" = true
WHERE "createdAt" < '2025-11-06'  -- Ngày deploy feature mới
AND "isEmailVerified" = false;
```

---

## Production Checklist

Trước khi deploy lên production:

- [ ] Cập nhật `.env` với SMTP credentials production
- [ ] Thay `APP_URL` thành domain thật (vd: `https://mimkat.com`)
- [ ] Test gửi email trên production environment
- [ ] Verify rate limiting đang hoạt động
- [ ] Setup monitoring cho cron jobs (optional: Sentry, Datadog)
- [ ] Cấu hình email templates với branding của công ty
- [ ] Test toàn bộ flow: register → verify → login → Google OAuth

---

## Bảo Mật Đã Implement

✅ Email verification bắt buộc
✅ Rate limiting chống spam
✅ Google ID thật (không dùng email)
✅ Tự động xóa unverified accounts
✅ Token expiry (48h)
✅ Bcrypt password hashing (12 rounds)
✅ Session management với device tracking
✅ Auto cleanup expired sessions

---

## Liên Hệ

Nếu có vấn đề, tạo issue tại GitHub repository.
