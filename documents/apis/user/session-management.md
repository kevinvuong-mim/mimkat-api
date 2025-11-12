# Session Management API Documentation

## Overview

API quản lý phiên đăng nhập (sessions) trên nhiều thiết bị. Cho phép xem danh sách thiết bị đang đăng nhập và đăng xuất khỏi thiết bị cụ thể.

**Base URL**: `/users`

---

## Endpoints

### 1. Get Active Sessions (Danh sách phiên đăng nhập)

Lấy danh sách tất cả các thiết bị đang đăng nhập của user hiện tại.

**Endpoint**: `GET /users/sessions`

**Authentication**: Required (Bearer Token hoặc Cookie)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Request Body (Optional)

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Nếu cung cấp `refreshToken`, phiên hiện tại sẽ được đánh dấu `isCurrent: true` trong response.

#### Response

**Success (200 OK)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "clx1234567890abcdefghij",
        "deviceName": "Chrome on macOS",
        "deviceType": "Desktop",
        "ipAddress": "192.168.1.100",
        "createdAt": "2025-11-07T08:00:00.000Z",
        "lastUsedAt": "2025-11-07T10:30:00.000Z",
        "expiresAt": "2025-11-14T08:00:00.000Z",
        "isCurrent": true
      },
      {
        "id": "clx0987654321zyxwvutsrq",
        "deviceName": "Safari on iPhone",
        "deviceType": "Mobile",
        "ipAddress": "192.168.1.101",
        "createdAt": "2025-11-06T15:20:00.000Z",
        "lastUsedAt": "2025-11-06T18:45:00.000Z",
        "expiresAt": "2025-11-13T15:20:00.000Z",
        "isCurrent": false
      }
    ]
  },
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/sessions"
}
```

| Field                 | Type    | Description                            |
| --------------------- | ------- | -------------------------------------- |
| sessions              | array   | Danh sách các phiên đăng nhập          |
| sessions[].id         | string  | Session ID (để dùng cho logout device) |
| sessions[].deviceName | string  | Tên thiết bị (browser + OS)            |
| sessions[].deviceType | string  | Loại thiết bị: Desktop, Mobile, Tablet |
| sessions[].ipAddress  | string  | Địa chỉ IP của thiết bị                |
| sessions[].createdAt  | string  | Thời điểm tạo session (ISO 8601)       |
| sessions[].lastUsedAt | string  | Lần cuối sử dụng (ISO 8601)            |
| sessions[].expiresAt  | string  | Thời điểm hết hạn (ISO 8601)           |
| sessions[].isCurrent  | boolean | true nếu là thiết bị hiện tại          |
| total                 | number  | Tổng số sessions                       |

**Error Responses**

- **401 Unauthorized**: Access token không hợp lệ

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/sessions"
}
```

#### cURL Example

```bash
curl -X GET http://localhost:3000/users/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Notes

- Chỉ hiển thị sessions chưa hết hạn (`expiresAt >= now`)
- Sessions được sắp xếp theo `lastUsedAt` giảm dần (mới nhất trước)
- `isCurrent` chỉ được set nếu cung cấp `refreshToken` trong request body

---

### 2. Logout All Devices (Đăng xuất tất cả thiết bị)

Đăng xuất khỏi tất cả các thiết bị bằng cách xóa tất cả sessions. User cần đăng nhập lại trên tất cả thiết bị.

**Endpoint**: `DELETE /users/sessions`

**Authentication**: Required (Bearer Token hoặc Cookie)

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
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/sessions"
}
```

#### cURL Example

```bash
curl -X DELETE http://localhost:3000/users/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Notes

- Xóa **TẤT CẢ** sessions của user
- Bao gồm cả thiết bị hiện tại
- User cần đăng nhập lại
- Hữu ích khi:
  - Nghi ngờ tài khoản bị xâm nhập
  - Muốn đăng xuất khỏi tất cả thiết bị cũ
  - Đổi mật khẩu và muốn force re-login

---

### 3. Logout Specific Device (Đăng xuất thiết bị cụ thể)

Đăng xuất khỏi một thiết bị cụ thể bằng session ID.

**Endpoint**: `DELETE /users/sessions/:tokenId`

**Authentication**: Required (Bearer Token hoặc Cookie)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### URL Parameters

| Parameter | Type   | Description                   |
| --------- | ------ | ----------------------------- |
| tokenId   | string | Session ID (từ GET /sessions) |

#### Response

**Success (200 OK)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": null,
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/sessions/:tokenId"
}
```

**Error Responses**

- **400 Bad Request**: Session không tồn tại hoặc không thuộc về user

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Session not found",
  "error": "Bad Request",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/sessions/:tokenId"
}
```

- **401 Unauthorized**: Access token không hợp lệ

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/sessions/:tokenId"
}
```

#### cURL Example

```bash
curl -X DELETE http://localhost:3000/users/sessions/clx1234567890abcdefghij \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Notes

- Chỉ xóa session được chỉ định
- Không ảnh hưởng đến thiết bị khác
- User có thể logout thiết bị hiện tại (sẽ cần đăng nhập lại)
- Hữu ích khi:
  - Thấy thiết bị lạ trong danh sách
  - Muốn đăng xuất khỏi thiết bị cũ không còn sử dụng
  - Remote logout từ thiết bị khác

---

## Session Lifecycle

### Session Creation

Sessions được tạo tự động khi:

- User đăng nhập (POST /auth/login)
- User đăng nhập bằng Google (GET /auth/google/callback)
- Refresh token (POST /auth/refresh) - token rotation

### Session Expiry

- **Refresh Token TTL**: 7 ngày (cấu hình trong `AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION`)
- **Auto cleanup**: Expired sessions được tự động xóa bởi cleanup service
- **Manual cleanup**: User có thể xóa bất kỳ lúc nào

### Session Limit

- **Max concurrent sessions**: Cấu hình trong `AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS`
- **Enforcement**: Khi đạt limit, session cũ nhất (oldest `lastUsedAt`) bị xóa tự động
- **Example**: Nếu limit = 5, login lần thứ 6 sẽ xóa session cũ nhất

---

## Security Considerations

### Session Security

1. **Refresh token rotation**: Token mới khi refresh, token cũ bị xóa
2. **Device limit**: Ngăn unlimited sessions
3. **IP tracking**: Phát hiện suspicious activity
4. **Last used tracking**: Identify inactive sessions

### Privacy Protection

1. **User-only access**: Chỉ user mới xem được sessions của mình
2. **No sensitive data**: Không lưu sensitive data trong session
3. **Secure storage**: Refresh tokens được lưu an toàn trong database

### Attack Prevention

1. **Session hijacking**: Token rotation giảm thiểu risk
2. **Concurrent login limit**: Ngăn spam sessions
3. **Auto cleanup**: Xóa expired sessions
4. **Logout all**: Quick response khi nghi ngờ bị hack
