# User Profile API Documentation

## Overview

API lấy thông tin profile đầy đủ của người dùng hiện tại dựa trên JWT token. Bao gồm thông tin về phương thức đăng nhập (`hasPassword`, `hasGoogleAuth`) để hỗ trợ logic frontend.

**Base URL**: `/users`

---

## Endpoint

### Get Current User Profile (Lấy thông tin profile đầy đủ)

Lấy thông tin profile đầy đủ của user đang đăng nhập, bao gồm `hasPassword` và `hasGoogleAuth` để xác định phương thức đăng nhập.

**Endpoint**: `GET /users/me`
**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Response

**Success (200 OK)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": {
    "id": "clx1234567890abcdefghij",
    "email": "user@example.com",
    "fullName": "John Doe",
    "username": "johndoe",
    "avatar": "https://example.com/avatar.jpg",
    "isActive": true,
    "isEmailVerified": true,
    "hasPassword": true,
    "hasGoogleAuth": false,
    "createdAt": "2025-11-07T00:00:00.000Z",
    "updatedAt": "2025-11-07T00:00:00.000Z"
  },
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/me"
}
```

#### Response Schema

| Field           | Type    | Description                             |
| --------------- | ------- | --------------------------------------- |
| id              | string  | User ID (CUID)                          |
| email           | string  | Email address                           |
| fullName        | string  | Tên đầy đủ của user (null nếu chưa set) |
| username        | string  | Username (null nếu chưa set)            |
| avatar          | string  | URL avatar (null nếu không có)          |
| isActive        | boolean | Trạng thái tài khoản                    |
| isEmailVerified | boolean | Email đã được xác thực chưa             |
| hasPassword     | boolean | User có password được set hay không     |
| hasGoogleAuth   | boolean | User có liên kết Google OAuth không     |
| createdAt       | string  | Thời gian tạo tài khoản (ISO 8601)      |
| updatedAt       | string  | Thời gian cập nhật cuối (ISO 8601)      |

**Error Responses**

- **401 Unauthorized**: Token không hợp lệ hoặc hết hạn

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/me"
}
```

- **401 Unauthorized**: User không tồn tại

```json
{
  "success": false,
  "statusCode": 401,
  "message": "User not found",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/me"
}
```

#### cURL Example

```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Use Cases

**Use Case 1: User đăng ký bằng email/password**

```json
{
  "id": "clx123...",
  "email": "user@example.com",
  "hasPassword": true, // ← User cần nhập current password khi đổi
  "hasGoogleAuth": false
}
```

**Use Case 2: User đăng nhập bằng Google (chưa set password)**

```json
{
  "id": "clx123...",
  "email": "user@gmail.com",
  "hasPassword": false, // ← User KHÔNG cần current password, có thể set lần đầu
  "hasGoogleAuth": true
}
```

**Use Case 3: User có cả 2 phương thức**

```json
{
  "id": "clx123...",
  "email": "user@gmail.com",
  "hasPassword": true, // ← User cần nhập current password
  "hasGoogleAuth": true
}
```
