# Authentication API Documentation

## Overview

API xác thực người dùng, hỗ trợ cả Bearer tokens và HttpOnly cookies.

**Base URL**: `/auth`

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

**Password Requirements:**

- Tối thiểu 8 ký tự
- Không yêu cầu chữ hoa, chữ thường, hoặc số (validation đơn giản cho đăng ký)

#### Response

**Success (201 Created)**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Resource created successfully",
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/register"
}
```

**Error Responses**

- **400 Bad Request**: Dữ liệu không hợp lệ

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 8 characters"
    }
  ],
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/register"
}
```

- **409 Conflict**: Email đã tồn tại

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email already in use",
  "error": "Conflict",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/register"
}
```

- **429 Too Many Requests**: Vượt quá rate limit

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/register"
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

Đăng nhập vào hệ thống với email và password. Tự động set cookies và trả về tokens.

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
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/login"
}
```

**Response Headers (Set-Cookie)**:

```
Set-Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

| Field        | Type   | Description                                       |
| ------------ | ------ | ------------------------------------------------- |
| accessToken  | string | JWT token để xác thực các API requests (1 giờ)    |
| refreshToken | string | Token để làm mới accessToken khi hết hạn (7 ngày) |

**Error Responses**

- **400 Bad Request**: Dữ liệu không hợp lệ

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    },
    {
      "field": "password",
      "message": "password should not be empty"
    }
  ],
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/login"
}
```

- **401 Unauthorized**: Sai email hoặc mật khẩu

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/login"
}
```

- **401 Unauthorized**: Email chưa được xác thực

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Please verify your email address before logging in. Check your inbox for the verification link.",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/login"
}
```

- **401 Unauthorized**: Tài khoản không hỗ trợ đăng nhập bằng password

```json
{
  "success": false,
  "statusCode": 401,
  "message": "This account does not have a password set. Please use Google login or reset your password.",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/login"
}
```

- **401 Unauthorized**: Tài khoản bị vô hiệu hóa

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Account has been disabled",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/login"
}
```

- **429 Too Many Requests**: Vượt quá rate limit

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/login"
}
```

#### Authentication Methods

**Method 1: Using Response Tokens (Mobile/API)**

```javascript
// Store tokens from response
const { accessToken, refreshToken } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Use in subsequent requests
fetch('/api/protected', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

**Method 2: Using Cookies (Web)**

```javascript
// Cookies are automatically set by browser
fetch('/api/protected', {
  credentials: 'include', // Include cookies
});
```

#### cURL Examples

**With response tokens:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**With cookies (save cookies):**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Notes

- **Dual Authentication Support**: Response tokens + HttpOnly cookies
- **Web Apps**: Sử dụng cookies (secure hơn, tự động gửi)
- **Mobile/APIs**: Sử dụng Authorization header
- Hệ thống tự động thu thập thông tin thiết bị từ request headers
- Mỗi người dùng có giới hạn số phiên đăng nhập đồng thời
- Khi vượt quá giới hạn, phiên cũ nhất sẽ tự động bị đăng xuất
- AccessToken: 1 giờ, RefreshToken: 7 ngày

---

### 3. Logout (Đăng xuất)

Đăng xuất khỏi thiết bị hiện tại, xóa session và clear cookies.

**Endpoint**: `POST /auth/logout`

**Authentication**: Required (Bearer Token hoặc Cookie)

#### Headers (Option 1)

```
Authorization: Bearer {accessToken}
```

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field        | Type   | Required | Description                                 |
| ------------ | ------ | -------- | ------------------------------------------- |
| refreshToken | string | No       | Refresh token (optional nếu sử dụng cookie) |

#### Response

**Success (200 OK)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/logout"
}
```

**Response Headers (Clear cookies)**:

```
Set-Cookie: accessToken=; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

**Error Responses**

- **400 Bad Request**: Refresh token không được cung cấp

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Refresh token not provided",
  "error": "Bad Request",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/logout"
}
```

- **401 Unauthorized**: Refresh token không hợp lệ

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/logout"
}
```

- **401 Unauthorized**: Access token không hợp lệ hoặc hết hạn

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/logout"
}
```

#### cURL Examples

**Using Authorization header:**

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Using cookies:**

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt
```

#### Notes

- **Cookie Method**: Refresh token tự động lấy từ cookie
- **Token Method**: Cần truyền refresh token trong body
- Chỉ xóa phiên đăng nhập của thiết bị hiện tại
- Các thiết bị khác vẫn giữ phiên đăng nhập
- Cookies tự động được clear

---

### 4. Refresh Token (Làm mới token)

Sử dụng refresh token để lấy cặp access token và refresh token mới. Hỗ trợ lấy refresh token từ cookie hoặc request body.

**Endpoint**: `POST /auth/refresh`

**Authentication**: Không yêu cầu (Public)

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field        | Type   | Required | Description                                 |
| ------------ | ------ | -------- | ------------------------------------------- |
| refreshToken | string | No       | Refresh token (optional nếu sử dụng cookie) |

#### Response

**Success (200 OK)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/refresh"
}
```

**Response Headers (Set new cookies)**:

```
Set-Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

| Field        | Type   | Description                                    |
| ------------ | ------ | ---------------------------------------------- |
| accessToken  | string | JWT token mới để xác thực các API requests     |
| refreshToken | string | Refresh token mới (token cũ đã bị vô hiệu hóa) |

**Error Responses**

- **400 Bad Request**: Refresh token không được cung cấp

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Refresh token not provided",
  "error": "Bad Request",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/refresh"
}
```

- **401 Unauthorized**: Refresh token không hợp lệ

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/refresh"
}
```

- **401 Unauthorized**: Refresh token hết hạn

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Refresh token has expired",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/auth/refresh"
}
```

#### cURL Examples

**Using request body:**

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Using cookies:**

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt
```

#### Notes

- **Hybrid Support**: Lấy refresh token từ cookie trước, fallback sang body
- **Token Rotation**: Mỗi lần refresh, token cũ sẽ bị xóa và tạo token mới
- **Cookie Update**: Tự động set cookies mới cho web clients
- **Response Tokens**: Vẫn trả về tokens trong response body
- Thông tin thiết bị được giữ nguyên từ phiên cũ
- AccessToken mới: 1 giờ, RefreshToken mới: 7 ngày

---

## Token Information

### Access Token

- **Thuật toán**: HS256 (HMAC with SHA-256)
- **Thời gian sống**: 1 giờ
- **Cookie Name**: `accessToken`
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
- **Cookie Name**: `refreshToken`
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

### CORS Configuration

- **Credentials**: `true` (cho phép cookies cross-origin)
- **Origins**: Cấu hình qua `CORS_ORIGIN` environment variable
- **Headers**: `Content-Type`, `Authorization`, `X-Client-Type`

### Session Management

- Số phiên đăng nhập đồng thời tối đa: Cấu hình trong `AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS`
- Khi vượt quá giới hạn: Tự động đăng xuất phiên cũ nhất
- Thông tin lưu trữ:
  - Device name (tên thiết bị)
  - Device type (loại thiết bị: Desktop, Mobile, Tablet)
  - IP address
  - User agent

### JWT Strategy

- **Token Sources**: Authorization header OR cookies
- **Priority**: Header token được ưu tiên trước, fallback về cookie
- **Validation**: Verify signature + check user exists & active

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
