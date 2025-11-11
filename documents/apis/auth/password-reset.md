# Password Reset API Documentation

## Overview

API đặt lại mật khẩu cho người dùng quên mật khẩu. Chỉ áp dụng cho tài khoản có password (tài khoản local hoặc tài khoản đã liên kết local login).

**Base URL**: `/auth`

---

## Endpoints

### 1. Forgot Password (Quên mật khẩu)

Gửi email chứa link đặt lại mật khẩu. Endpoint này không tiết lộ thông tin về sự tồn tại của email (security best practice).

**Endpoint**: `POST /auth/forgot-password`

**Rate Limit**: 3 requests / 1 giờ

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "email": "user@example.com"
}
```

| Field | Type   | Required | Validation         | Description                |
| ----- | ------ | -------- | ------------------ | -------------------------- |
| email | string | Yes      | Valid email format | Email cần đặt lại mật khẩu |

#### Response

**Success (200 OK)**

```json
{
  "message": "If an account with that email exists, we sent a password reset link."
}
```

**Notes**:

- Response luôn giống nhau dù email có tồn tại hay không (security feature)
- Ngăn attacker dò tìm email đã đăng ký

**Error Responses**

- **429 Too Many Requests**: Vượt quá rate limit

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### Notes

- Chỉ gửi email cho tài khoản có password được set
- Tài khoản chỉ có Google OAuth (không có password) không thể đặt lại mật khẩu
- Token có hiệu lực 1 giờ (ngắn hơn email verification để tăng bảo mật)
- Nếu gửi email thất bại, log error nhưng vẫn trả về success message

---

### 2. Reset Password (Đặt lại mật khẩu)

Đặt lại mật khẩu mới sử dụng token từ email.

**Endpoint**: `POST /auth/reset-password`

**Rate Limit**: 5 requests / 1 giờ

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "token": "a1b2c3d4e5f6...",
  "password": "NewSecurePass123"
}
```

| Field    | Type   | Required | Validation           | Description    |
| -------- | ------ | -------- | -------------------- | -------------- |
| token    | string | Yes      | 64 hex characters    | Token từ email |
| password | string | Yes      | Minimum 8 characters | Mật khẩu mới   |

#### Response

**Success (200 OK)**

```json
{
  "message": "Password reset successful. Please log in with your new password."
}
```

**Error Responses**

- **400 Bad Request**: Token không hợp lệ hoặc hết hạn

```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token",
  "error": "Bad Request"
}
```

- **400 Bad Request**: Password validation failed

```json
{
  "statusCode": 400,
  "message": ["password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

- **429 Too Many Requests**: Vượt quá rate limit

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN",
    "password": "NewSecurePass123"
  }'
```

#### Notes

- Sau khi đặt lại mật khẩu thành công:
- Password cũ bị thay thế bằng password mới (hash bcrypt, salt rounds = 12)
- **Tất cả sessions hiện tại bị xóa** (security measure)
- Token reset bị xóa khỏi database
- User cần đăng nhập lại với mật khẩu mới

---

## Security Features

### Token Generation

```typescript
// Generate random 32-byte token (64 hex characters)
const resetToken = crypto.randomBytes(32).toString('hex');

// Hash token before storing in database
const hashedToken = await bcrypt.hash(resetToken, 10);
```

### Token Storage

- **Plain token**: Gửi qua email (1 lần duy nhất)
- **Hashed token**: Lưu trong database (field `passwordResetToken`)
- **Expiry**: 1 giờ từ thời điểm tạo (field `passwordResetTokenExpiry`)

### Password Hashing

- **Algorithm**: bcrypt
- **Salt Rounds**: 12 (high security)
- **Same as registration**: Đảm bảo consistency

### Session Invalidation

Sau khi đặt lại mật khẩu:

```typescript
// Invalidate all existing sessions
await prisma.session.deleteMany({
  where: { userId: matchedUserId },
});
```

**Rationale**: Ngăn attacker sử dụng sessions cũ nếu họ đã chiếm quyền truy cập

---

## Common Errors

### Token Expired

**Scenario**: User click link sau 1 giờ

**Response**:

```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token",
  "error": "Bad Request"
}
```

**Solution**: Yêu cầu gửi lại email reset bằng `/auth/forgot-password`

### OAuth Account

**Scenario**: User chỉ có Google account (không có password) cố đặt lại mật khẩu

**Response**:

```json
{
  "message": "If an account with that email exists, we sent a password reset link."
}
```

**Note**: Không gửi email thực tế, nhưng response giống nhau

**Solution**: Thông báo user sử dụng Google login

### Password Too Weak

**Scenario**: Password < 8 ký tự

**Response**:

```json
{
  "statusCode": 400,
  "message": ["password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```
