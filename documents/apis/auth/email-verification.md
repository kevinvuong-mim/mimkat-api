# Email Verification API Documentation

## Overview

API xác thực email người dùng sau khi đăng ký.

**Base URL**: `/api/v1/auth`

---

## Endpoints

### 1. Verify Email (Xác thực email)

Xác thực email của người dùng thông qua token được gửi qua email.

**Endpoint**: `GET /api/v1/auth/verify-email`

**Authentication**: Không yêu cầu (Public)

#### Query Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| token     | string | Yes      | Token xác thực được gửi qua email |

#### Response

**Success (200 OK)**

```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Error Responses**

- **400 Bad Request**: Token không hợp lệ hoặc thiếu

```json
{
  "statusCode": 400,
  "message": "Verification token is required",
  "error": "Bad Request"
}
```

- **401 Unauthorized**: Token không hợp lệ hoặc hết hạn

```json
{
  "statusCode": 401,
  "message": "Invalid or expired verification token",
  "error": "Unauthorized"
}
```

- **409 Conflict**: Email đã được xác thực trước đó

```json
{
  "statusCode": 409,
  "message": "Email already verified",
  "error": "Conflict"
}
```

#### cURL Example

```bash
curl -X GET "http://localhost:3000/api/v1/auth/verify-email?token=YOUR_VERIFICATION_TOKEN"
```

---

### 2. Resend Verification Email (Gửi lại email xác thực)

Gửi lại email xác thực cho người dùng chưa xác thực email.

**Endpoint**: `POST /api/v1/auth/resend-verification`

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
| email | string | Yes      | Valid email format | Email cần gửi lại xác thực |

#### Response

**Success (200 OK)**

```json
{
  "message": "Verification email sent successfully. Please check your inbox."
}
```

**Error Responses**

- **400 Bad Request**: Email không hợp lệ

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request"
}
```

- **404 Not Found**: Email không tồn tại trong hệ thống

```json
{
  "statusCode": 404,
  "message": "User with this email not found",
  "error": "Not Found"
}
```

- **409 Conflict**: Email đã được xác thực

```json
{
  "statusCode": 409,
  "message": "Email already verified",
  "error": "Conflict"
}
```

- **429 Too Many Requests**: Vượt quá rate limit

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```
