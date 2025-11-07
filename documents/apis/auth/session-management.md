# Session Management API Documentation

## Overview

API quản lý phiên đăng nhập (sessions) trên nhiều thiết bị. Cho phép xem danh sách thiết bị đang đăng nhập và đăng xuất khỏi thiết bị cụ thể.

**Base URL**: `/auth`

---

## Endpoints

### 1. Get Active Sessions (Danh sách phiên đăng nhập)

Lấy danh sách tất cả các thiết bị đang đăng nhập của user hiện tại.

**Endpoint**: `GET /auth/sessions`

**Authentication**: Required (Bearer Token)

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
  ],
  "total": 2
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
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### cURL Example

```bash
curl -X GET http://localhost:3000/auth/sessions \
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

**Endpoint**: `DELETE /auth/sessions`

**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Response

**Success (200 OK)**

```json
{
  "message": "Logged out from all devices successfully"
}
```

**Error Responses**

- **401 Unauthorized**: Access token không hợp lệ

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### cURL Example

```bash
curl -X DELETE http://localhost:3000/auth/sessions \
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

**Endpoint**: `DELETE /auth/sessions/:tokenId`

**Authentication**: Required (Bearer Token)

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
  "message": "Device logged out successfully"
}
```

**Error Responses**

- **400 Bad Request**: Session không tồn tại hoặc không thuộc về user

```json
{
  "statusCode": 400,
  "message": "Session not found",
  "error": "Bad Request"
}
```

- **401 Unauthorized**: Access token không hợp lệ

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### cURL Example

```bash
curl -X DELETE http://localhost:3000/auth/sessions/clx1234567890abcdefghij \
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

## Device Information

### Device Info Collection

Thông tin thiết bị được tự động thu thập từ HTTP request headers:

```typescript
// Extracted from request headers
{
  deviceName: "Chrome 120.0 on macOS 14.0",  // From user-agent
  deviceType: "Desktop",                      // Desktop | Mobile | Tablet
  ipAddress: "192.168.1.100",                 // Client IP
  userAgent: "Mozilla/5.0..."                 // Full user-agent string
}
```

### Device Name Format

- **Desktop**: `{Browser} {Version} on {OS} {Version}`
- **Mobile**: `{Browser} on {Device} ({OS})`
- **Tablet**: `{Browser} on {Device} ({OS})`

**Examples**:

- `Chrome 120.0 on macOS 14.0`
- `Safari on iPhone (iOS 17.0)`
- `Firefox 119.0 on Windows 11`
- `Edge on iPad (iPadOS 17.0)`

### Device Type Detection

```typescript
// Based on user-agent string
if (ua.includes('mobile')) return 'Mobile';
if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
return 'Desktop';
```

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

## Frontend Integration

### Session List Component

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Session {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    const response = await fetch('/auth/sessions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    setSessions(data.sessions);
  };

  const logoutDevice = async (sessionId: string) => {
    const accessToken = localStorage.getItem('accessToken');

    await fetch(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Reload sessions
    loadSessions();
  };

  const logoutAllDevices = async () => {
    const accessToken = localStorage.getItem('accessToken');

    await fetch('/auth/sessions', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Clear local storage and redirect to login
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  return (
    <div>
      <h2>Active Sessions</h2>
      <button onClick={logoutAllDevices}>Logout All Devices</button>

      <ul>
        {sessions.map(session => (
          <li key={session.id}>
            <div>
              <strong>{session.deviceName}</strong>
              {session.isCurrent && <span> (Current)</span>}
            </div>
            <div>IP: {session.ipAddress}</div>
            <div>Last used: {new Date(session.lastUsedAt).toLocaleString()}</div>
            {!session.isCurrent && (
              <button onClick={() => logoutDevice(session.id)}>
                Logout this device
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

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

---

## Use Cases

### 1. View All Logged-in Devices

**User Story**: "Tôi muốn xem tất cả thiết bị đang đăng nhập vào tài khoản của tôi"

**Solution**: GET /auth/sessions

### 2. Remote Logout Suspicious Device

**User Story**: "Tôi thấy thiết bị lạ trong danh sách, muốn đăng xuất ngay"

**Solution**: DELETE /auth/sessions/:tokenId với sessionId của thiết bị lạ

### 3. Security Breach Response

**User Story**: "Tài khoản có thể bị xâm nhập, cần đăng xuất tất cả thiết bị"

**Solution**: DELETE /auth/sessions (logout all)

### 4. Cleanup Old Devices

**User Story**: "Tôi không còn dùng laptop cũ, muốn xóa session đó"

**Solution**: DELETE /auth/sessions/:tokenId

---

## Database Schema

### Session Table

```prisma
model Session {
  id            String   @id @default(cuid())
  userId        String
  refreshToken  String   @unique
  deviceName    String?
  deviceType    String?
  ipAddress     String?
  userAgent     String?
  lastUsedAt    DateTime @default(now())
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

---

## Related APIs

- [Authentication](./authentication.md) - Login tạo session mới
- [Google OAuth](./google-oauth.md) - Google login tạo session mới
- [Password Reset](./password-reset.md) - Reset password xóa tất cả sessions
