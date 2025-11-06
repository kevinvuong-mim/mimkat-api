# Authentication API Documentation

## Overview

API xác thực người dùng bao gồm đăng ký, đăng nhập, đăng xuất, và quản lý phiên làm việc (sessions).

**Base URL**: `/api/v1/auth`

---

## Endpoints

### 1. Register (Đăng ký)

Tạo tài khoản người dùng mới.

**Endpoint**: `POST /api/v1/auth/register`

**Rate Limit**: 5 requests / 15 phút

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

| Field    | Type   | Required | Validation           | Description          |
| -------- | ------ | -------- | -------------------- | -------------------- |
| email    | string | Yes      | Valid email format   | Email của người dùng |
| password | string | Yes      | Minimum 8 characters | Mật khẩu             |

#### Response

**Success (201 Created)**

```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": false,
    "createdAt": "2025-11-06T00:00:00.000Z"
  }
}
```

**Error Responses**

- **400 Bad Request**: Dữ liệu không hợp lệ

```json
{
  "statusCode": 400,
  "message": [
    "Invalid email format",
    "Password must be at least 8 characters long"
  ],
  "error": "Bad Request"
}
```

- **409 Conflict**: Email đã tồn tại

```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
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
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

### 2. Login (Đăng nhập)

Đăng nhập vào hệ thống với email và password.

**Endpoint**: `POST /api/v1/auth/login`

**Rate Limit**: 10 requests / 15 phút

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

| Field    | Type   | Required | Description      |
| -------- | ------ | -------- | ---------------- |
| email    | string | Yes      | Email đã đăng ký |
| password | string | Yes      | Mật khẩu         |

#### Response

**Success (200 OK)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid-refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Error Responses**

- **400 Bad Request**: Dữ liệu không hợp lệ

```json
{
  "statusCode": 400,
  "message": ["Invalid email format", "Password is required"],
  "error": "Bad Request"
}
```

- **401 Unauthorized**: Sai email hoặc mật khẩu

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

- **403 Forbidden**: Email chưa được xác thực

```json
{
  "statusCode": 403,
  "message": "Please verify your email before logging in",
  "error": "Forbidden"
}
```

- **429 Too Many Requests**: Vượt quá rate limit

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

### 3. Logout (Đăng xuất)

Đăng xuất khỏi thiết bị hiện tại (vô hiệu hóa refresh token).

**Endpoint**: `POST /api/v1/auth/logout`

**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Request Body

```json
{
  "refreshToken": "your-refresh-token"
}
```

| Field        | Type   | Required | Description                   |
| ------------ | ------ | -------- | ----------------------------- |
| refreshToken | string | Yes      | Refresh token cần vô hiệu hóa |

#### Response

**Success (200 OK)**

```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**

- **401 Unauthorized**: Access token không hợp lệ hoặc hết hạn

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

- **404 Not Found**: Refresh token không tồn tại

```json
{
  "statusCode": 404,
  "message": "Refresh token not found",
  "error": "Not Found"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

---

### 4. Refresh Token (Làm mới token)

Sử dụng refresh token để lấy access token mới khi token cũ hết hạn.

**Endpoint**: `POST /api/v1/auth/refresh`

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "refreshToken": "your-refresh-token"
}
```

| Field        | Type   | Required | Description          |
| ------------ | ------ | -------- | -------------------- |
| refreshToken | string | Yes      | Refresh token hợp lệ |

#### Response

**Success (200 OK)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new-uuid-refresh-token"
}
```

**Error Responses**

- **401 Unauthorized**: Refresh token không hợp lệ hoặc hết hạn

```json
{
  "statusCode": 401,
  "message": "Invalid or expired refresh token",
  "error": "Unauthorized"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

---

### 5. Get Active Sessions (Danh sách phiên đăng nhập)

Lấy danh sách tất cả các thiết bị đang đăng nhập.

**Endpoint**: `GET /api/v1/auth/sessions`

**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Request Body (Optional)

```json
{
  "refreshToken": "current-refresh-token"
}
```

Nếu cung cấp `refreshToken`, phiên hiện tại sẽ được đánh dấu trong response.

#### Response

**Success (200 OK)**

```json
{
  "sessions": [
    {
      "id": "session-uuid-1",
      "deviceInfo": {
        "browser": "Chrome",
        "os": "macOS",
        "device": "Desktop"
      },
      "ipAddress": "192.168.1.1",
      "lastUsed": "2025-11-06T10:30:00.000Z",
      "createdAt": "2025-11-06T08:00:00.000Z",
      "isCurrent": true
    },
    {
      "id": "session-uuid-2",
      "deviceInfo": {
        "browser": "Safari",
        "os": "iOS",
        "device": "Mobile"
      },
      "ipAddress": "192.168.1.2",
      "lastUsed": "2025-11-05T15:20:00.000Z",
      "createdAt": "2025-11-05T15:20:00.000Z",
      "isCurrent": false
    }
  ]
}
```

#### cURL Example

```bash
curl -X GET http://localhost:3000/api/v1/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 6. Logout All Devices (Đăng xuất tất cả thiết bị)

Đăng xuất khỏi tất cả các thiết bị (vô hiệu hóa tất cả refresh tokens).

**Endpoint**: `DELETE /api/v1/auth/sessions`

**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Response

**Success (200 OK)**

```json
{
  "message": "Logged out from all devices successfully",
  "deletedSessions": 3
}
```

**Error Responses**

- **401 Unauthorized**: Access token không hợp lệ

#### cURL Example

```bash
curl -X DELETE http://localhost:3000/api/v1/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 7. Logout Specific Device (Đăng xuất thiết bị cụ thể)

Đăng xuất khỏi một thiết bị cụ thể bằng tokenId.

**Endpoint**: `DELETE /api/v1/auth/sessions/:tokenId`

**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### URL Parameters

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| tokenId   | string | ID của refresh token/session cần xóa |

#### Response

**Success (200 OK)**

```json
{
  "message": "Device logged out successfully"
}
```

**Error Responses**

- **401 Unauthorized**: Access token không hợp lệ
- **403 Forbidden**: Không có quyền xóa session này
- **404 Not Found**: Token ID không tồn tại

#### cURL Example

```bash
curl -X DELETE http://localhost:3000/api/v1/auth/sessions/session-uuid-1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Response Codes

| Status Code | Description                                      |
| ----------- | ------------------------------------------------ |
| 200         | OK - Request successful                          |
| 201         | Created - Resource created successfully          |
| 400         | Bad Request - Invalid input data                 |
| 401         | Unauthorized - Invalid or missing authentication |
| 403         | Forbidden - Access denied                        |
| 404         | Not Found - Resource not found                   |
| 409         | Conflict - Resource already exists               |
| 429         | Too Many Requests - Rate limit exceeded          |
| 500         | Internal Server Error - Server error             |
