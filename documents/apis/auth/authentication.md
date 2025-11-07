# Authentication API Documentation

## Overview

API xác thực người dùng cơ bản bao gồm đăng ký, đăng nhập, đăng xuất và làm mới token.

**Base URL**: `/auth`

**Các API liên quan:**

- [Email Verification](./email-verification.md) - Xác thực email
- [Password Reset](./password-reset.md) - Quên mật khẩu và đặt lại mật khẩu
- [Google OAuth](./google-oauth.md) - Đăng nhập bằng Google
- [Session Management](./session-management.md) - Quản lý phiên đăng nhập
- [User Profile](./user-profile.md) - Thông tin người dùng

---

## Endpoints

### 1. Register (Đăng ký)

Tạo tài khoản người dùng mới với email và mật khẩu. Sau khi đăng ký thành công, hệ thống sẽ gửi email xác thực đến địa chỉ email đã đăng ký.

**Endpoint**: `POST /auth/register`

**Rate Limit**: 5 requests / 15 phút

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
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
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "clx1234567890abcdefghij",
    "email": "user@example.com",
    "createdAt": "2025-11-07T00:00:00.000Z"
  }
}
```

**Error Responses**

- **400 Bad Request**: Dữ liệu không hợp lệ

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

- **409 Conflict**: Email đã tồn tại

```json
{
  "statusCode": 409,
  "message": "Email already in use",
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
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Notes

- Mật khẩu được hash bằng bcrypt với salt rounds = 12
- Token xác thực email có hiệu lực 48 giờ
- Email xác thực được gửi tự động sau khi đăng ký
- Người dùng cần xác thực email trước khi có thể đăng nhập

---

### 2. Login (Đăng nhập)

Đăng nhập vào hệ thống với email và password. Chỉ hỗ trợ tài khoản đăng ký bằng email (provider = 'local').

**Endpoint**: `POST /auth/login`

**Rate Limit**: 10 requests / 15 phút

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
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
  "message": "Login successful",
  "user": {
    "id": "clx1234567890abcdefghij",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

| Field        | Type   | Description                                      |
| ------------ | ------ | ------------------------------------------------ |
| message      | string | Thông báo đăng nhập thành công                   |
| user         | object | Thông tin cơ bản của người dùng                  |
| accessToken  | string | JWT token để xác thực các API requests           |
| refreshToken | string | Token để làm mới accessToken khi hết hạn         |
| expiresIn    | number | Thời gian hết hạn của accessToken (giây) = 1 giờ |

**Error Responses**

- **400 Bad Request**: Dữ liệu không hợp lệ

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password should not be empty"],
  "error": "Bad Request"
}
```

- **401 Unauthorized**: Sai email hoặc mật khẩu

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

- **401 Unauthorized**: Email chưa được xác thực

```json
{
  "statusCode": 401,
  "message": "Please verify your email address before logging in. Check your inbox for the verification link.",
  "error": "Unauthorized"
}
```

- **401 Unauthorized**: Tài khoản không hỗ trợ đăng nhập bằng password

```json
{
  "statusCode": 401,
  "message": "This account does not support password login. Please use your account provider.",
  "error": "Unauthorized"
}
```

- **401 Unauthorized**: Tài khoản bị vô hiệu hóa

```json
{
  "statusCode": 401,
  "message": "Account has been disabled",
  "error": "Unauthorized"
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
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Notes

- Hệ thống tự động thu thập thông tin thiết bị (device info) từ request headers
- Mỗi người dùng có giới hạn số thiết bị đăng nhập đồng thời (xem AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS)
- Khi vượt quá giới hạn, phiên cũ nhất sẽ tự động bị đăng xuất
- AccessToken có thời gian sống 1 giờ
- RefreshToken có thời gian sống 7 ngày (xem AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION)

---

### 3. Logout (Đăng xuất)

Đăng xuất khỏi thiết bị hiện tại bằng cách vô hiệu hóa refresh token.

**Endpoint**: `POST /auth/logout`

**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field        | Type   | Required | Description                   |
| ------------ | ------ | -------- | ----------------------------- |
| refreshToken | string | Yes      | Refresh token cần vô hiệu hóa |

#### Response

**Success (200 OK)**

```json
{
  "message": "Logout successful"
}
```

**Error Responses**

- **400 Bad Request**: Thiếu refresh token

```json
{
  "statusCode": 400,
  "message": "Refresh token not provided",
  "error": "Bad Request"
}
```

- **401 Unauthorized**: Access token không hợp lệ hoặc hết hạn

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

- **401 Unauthorized**: Refresh token không hợp lệ

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Notes

- Chỉ xóa phiên đăng nhập của thiết bị hiện tại
- Các thiết bị khác vẫn giữ phiên đăng nhập
- Để đăng xuất tất cả thiết bị, sử dụng [DELETE /auth/sessions](./session-management.md#2-logout-all-devices)

---

### 4. Refresh Token (Làm mới token)

Sử dụng refresh token để lấy cặp access token và refresh token mới khi token cũ sắp hết hạn. Hệ thống sử dụng **token rotation** - refresh token cũ sẽ bị xóa và tạo token mới để tăng cường bảo mật.

**Endpoint**: `POST /auth/refresh`

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field        | Type   | Required | Description          |
| ------------ | ------ | -------- | -------------------- |
| refreshToken | string | Yes      | Refresh token hợp lệ |

#### Response

**Success (200 OK)**

```json
{
  "message": "Token refresh successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

| Field        | Type   | Description                                    |
| ------------ | ------ | ---------------------------------------------- |
| message      | string | Thông báo làm mới token thành công             |
| accessToken  | string | JWT token mới để xác thực các API requests     |
| refreshToken | string | Refresh token mới (token cũ đã bị vô hiệu hóa) |
| expiresIn    | number | Thời gian hết hạn của accessToken (giây)       |

**Error Responses**

- **400 Bad Request**: Thiếu refresh token

```json
{
  "statusCode": 400,
  "message": "Refresh token not provided",
  "error": "Bad Request"
}
```

- **401 Unauthorized**: Refresh token không hợp lệ

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized"
}
```

- **401 Unauthorized**: Refresh token hết hạn

```json
{
  "statusCode": 401,
  "message": "Refresh token has expired",
  "error": "Unauthorized"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Notes

- **Token Rotation**: Mỗi lần refresh, token cũ sẽ bị xóa và tạo token mới
- Thông tin thiết bị (device info) được giữ nguyên từ phiên cũ
- Nếu refresh token hết hạn, người dùng phải đăng nhập lại
- AccessToken mới có thời gian sống 1 giờ
- RefreshToken mới có thời gian sống 7 ngày

---

## Token Information

### Access Token

- **Thuật toán**: HS256 (HMAC with SHA-256)
- **Thời gian sống**: 1 giờ
- **Secret**: `JWT_SECRET` (environment variable)
- **Payload**:
  ```json
  {
    "sub": "userId",
    "iat": 1699286400,
    "exp": 1699290000
  }
  ```

### Refresh Token

- **Thuật toán**: HS256 (HMAC with SHA-256)
- **Thời gian sống**: 7 ngày
- **Secret**: `JWT_REFRESH_SECRET` (environment variable)
- **Lưu trữ**: Database (bảng Session)
- **Token Rotation**: Được áp dụng khi refresh

---

## Security Features

### Password Hashing

- **Algorithm**: bcrypt
- **Salt Rounds**: 12 (high security)
- **Computation Time**: ~300-500ms per hash

### Rate Limiting

| Endpoint       | Limit                 |
| -------------- | --------------------- |
| POST /register | 5 requests / 15 phút  |
| POST /login    | 10 requests / 15 phút |
| POST /refresh  | Không giới hạn        |
| POST /logout   | Không giới hạn        |

### Device Management

- Số thiết bị đăng nhập đồng thời tối đa: Cấu hình trong `AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS`
- Khi vượt quá giới hạn: Tự động đăng xuất thiết bị cũ nhất
- Thông tin lưu trữ:
  - Device name (tên thiết bị)
  - Device type (loại thiết bị: Desktop, Mobile, Tablet)
  - IP address
  - User agent
  - Last used timestamp

### Token Security

- **Access Token**: Chỉ lưu ở client (localStorage/memory)
- **Refresh Token**:
  - Lưu ở client (localStorage)
  - Lưu hash ở database
  - Token rotation khi refresh
  - Tự động xóa khi hết hạn

---

## Common Response Codes

| Status Code | Description                                      |
| ----------- | ------------------------------------------------ |
| 200         | OK - Request successful                          |
| 201         | Created - Resource created successfully          |
| 400         | Bad Request - Invalid input data                 |
| 401         | Unauthorized - Invalid or missing authentication |
| 409         | Conflict - Resource already exists               |
| 429         | Too Many Requests - Rate limit exceeded          |
| 500         | Internal Server Error - Server error             |

---

## Integration Guide

### Client-side Storage

**Khuyến nghị lưu trữ tokens:**

```javascript
// Sau khi login/register thành công
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Khi gọi API
const token = localStorage.getItem('accessToken');
fetch('/api/protected-route', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Khi logout
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

### Auto Token Refresh

**Tự động làm mới token khi hết hạn:**

```javascript
// Axios interceptor example
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/auth/refresh', { refreshToken });

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
      return axios(originalRequest);
    }

    return Promise.reject(error);
  },
);
```
