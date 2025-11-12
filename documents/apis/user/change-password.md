# Change Password API Documentation

## Overview

API đổi mật khẩu cho người dùng đã đăng nhập. Hỗ trợ hai trường hợp:

1. **Người dùng đã có mật khẩu** (tài khoản email/password truyền thống): Phải cung cấp mật khẩu hiện tại
2. **Người dùng Google OAuth chưa có mật khẩu**: Có thể đặt mật khẩu mà không cần mật khẩu hiện tại

**Base URL**: `/users`

---

## Endpoint

**Endpoint**: `PUT /users/password`

**Rate Limit**: 5 requests / 1 giờ

**Authentication**: Required (Bearer Token hoặc Cookie)

### Request Headers

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request Body

**Đối với người dùng đã có mật khẩu:**

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Đối với người dùng Google OAuth đặt mật khẩu lần đầu:**

```json
{
  "newPassword": "NewPassword456"
}
```

### Request Body Schema

### Request Body Schema

| Field           | Type   | Required | Validation           | Description                                                                                                 |
| --------------- | ------ | -------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| currentPassword | string | Optional | -                    | Mật khẩu hiện tại. Bắt buộc nếu user đã có password. Không bắt buộc cho user Google OAuth chưa có password. |
| newPassword     | string | Yes      | Minimum 8 characters | Mật khẩu mới. Phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.                                   |

### Password Requirements

- Tối thiểu 8 ký tự
- Ít nhất một chữ hoa (A-Z)
- Ít nhất một chữ thường (a-z)
- Ít nhất một chữ số (0-9)

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

Hoặc khi user Google đặt mật khẩu lần đầu:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

### Error Responses

**400 Bad Request - Yêu cầu mật khẩu hiện tại**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Current password is required to change password",
  "error": "Bad Request",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

**401 Unauthorized - Mật khẩu hiện tại không đúng**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Current password is incorrect",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

**401 Unauthorized - Không tìm thấy người dùng**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "User not found",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

**400 Bad Request - Mật khẩu không hợp lệ**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "field": "newPassword",
      "message": "Password must be at least 8 characters long"
    },
    {
      "field": "newPassword",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ],
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

**429 Too Many Requests - Vượt quá rate limit**

```json
{
  "success": false,
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

---

## Use Cases

### Use Case 1: Người dùng truyền thống đổi mật khẩu

Người dùng đã đăng ký bằng email/password muốn thay đổi mật khẩu.

**Request:**

```bash
curl -X PUT http://localhost:3000/users/password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123",
    "newPassword": "NewSecurePassword456"
  }'
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

---

### Use Case 2: Người dùng Google OAuth đặt mật khẩu

Người dùng ban đầu đăng nhập bằng Google muốn đặt mật khẩu để sử dụng đăng nhập email/password.

**Request:**

```bash
curl -X PUT http://localhost:3000/users/password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewSecurePassword456"
  }'
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

---

### Use Case 3: Người dùng nhập sai mật khẩu hiện tại

Người dùng cố gắng đổi mật khẩu nhưng nhập sai mật khẩu hiện tại.

**Request:**

```bash
curl -X PUT http://localhost:3000/users/password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "WrongPassword123",
    "newPassword": "NewSecurePassword456"
  }'
```

**Response:**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Current password is incorrect",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/password"
}
```

---

## Security Considerations

1. **Xác thực mật khẩu hiện tại**: Đối với người dùng đã có mật khẩu, hệ thống yêu cầu mật khẩu hiện tại để ngăn chặn thay đổi mật khẩu trái phép nếu ai đó truy cập được phiên đăng nhập.

2. **Password Hashing**: Mật khẩu được hash bằng bcrypt với 12 salt rounds trước khi lưu trữ.

3. **Rate Limiting**: Endpoint được bảo vệ bằng rate limiting (5 requests/giờ) để ngăn chặn tấn công brute force.

4. **Yêu cầu Token**: Yêu cầu JWT access token hợp lệ, đảm bảo chỉ người dùng đã xác thực mới có thể đổi mật khẩu.

5. **Vô hiệu hóa tất cả phiên**: Sau khi đổi mật khẩu, tất cả phiên đăng nhập trên mọi thiết bị sẽ bị xóa để bảo mật. Người dùng cần đăng nhập lại với mật khẩu mới.

6. **Người dùng Google OAuth**: Người dùng đăng nhập bằng Google mà chưa có mật khẩu có thể đặt mật khẩu mà không cần mật khẩu hiện tại, cho phép họ sử dụng đăng nhập email/password trong tương lai.

---

## Notes

- **QUAN TRỌNG**: Sau khi đổi mật khẩu thành công, TẤT CẢ các phiên đăng nhập trên mọi thiết bị sẽ bị xóa để đảm bảo bảo mật.
- Người dùng sẽ cần đăng nhập lại bằng mật khẩu mới trên tất cả thiết bị.
- Hành vi này giống với endpoint `POST /auth/reset-password` để đảm bảo tính nhất quán về bảo mật.
- Validation mật khẩu tuân theo các quy tắc giống như đăng ký.
