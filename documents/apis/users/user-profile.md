# User Profile API Documentation

## Overview

API lấy thông tin profile đầy đủ của người dùng hiện tại dựa trên JWT token. Bao gồm thông tin về phương thức đăng nhập (`hasPassword`, `hasGoogleAuth`) để hỗ trợ logic frontend.

**Base URL**: `/users`

---

## Endpoint

### Get Current User Profile (Lấy thông tin profile đầy đủ)

Lấy thông tin profile đầy đủ của user đang đăng nhập, bao gồm `hasPassword` và `hasGoogleAuth` để xác định phương thức đăng nhập.

**Endpoint**: `GET /users/me`

**Authentication**: Required (Bearer Token hoặc Cookie)

**Rate Limit**: Không giới hạn

#### Headers

```
Authorization: Bearer {accessToken}
```

**Or using cookies:**

```
Cookie: accessToken=<token>
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

| Field           | Type         | Description                                                        |
| --------------- | ------------ | ------------------------------------------------------------------ |
| id              | string       | User ID (CUID format)                                              |
| email           | string       | Email address (unique, required)                                   |
| fullName        | string\|null | Tên đầy đủ của user (null nếu chưa set)                            |
| username        | string\|null | Username (null nếu chưa set)                                       |
| avatar          | string\|null | URL avatar (null nếu không có)                                     |
| isActive        | boolean      | Trạng thái tài khoản (true = active, false = disabled)             |
| isEmailVerified | boolean      | Email đã được xác thực chưa (true = verified)                      |
| hasPassword     | boolean      | User có password được set hay không (computed from password field) |
| hasGoogleAuth   | boolean      | User có liên kết Google OAuth không (computed from googleId field) |
| createdAt       | string       | Thời gian tạo tài khoản (ISO 8601 format)                          |
| updatedAt       | string       | Thời gian cập nhật cuối (ISO 8601 format)                          |

**Important Notes**:

- `hasPassword` = `!!user.password` - Boolean flag, không expose actual password
- `hasGoogleAuth` = `!!user.googleId` - Indicates nếu Google account được linked
- `fullName`, `username`, `avatar` có thể null nếu user chưa set
- Response không bao gồm sensitive fields: `password`, `googleId`, `verificationToken`, etc.

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

- **403 Forbidden**: User không tồn tại hoặc bị vô hiệu hóa

```json
{
  "success": false,
  "statusCode": 403,
  "message": "User does not exist",
  "error": "Forbidden",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/me"
}
```

hoặc

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Account has been disabled",
  "error": "Forbidden",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "path": "/users/me"
}
```

#### cURL Example

**Using Authorization header:**

```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Using cookies:**

```bash
curl -X GET http://localhost:3000/users/me \
  -b "accessToken=YOUR_TOKEN"
```

---

## Business Logic

1. **Extract userId**: Lấy userId từ JWT token payload (`sub` field)
2. **Query database**: Tìm user với Prisma `findUnique({ where: { id: userId } })`
3. **Check user exists**: Throw `ForbiddenException` (403) nếu user không tồn tại (via JWT Strategy)
4. **Check user active**: Throw `ForbiddenException` (403) nếu user bị disabled (via JWT Strategy)
5. **Check session valid**: Throw `ForbiddenException` (403) nếu session không tồn tại hoặc đã bị logout (via JWT Strategy)
6. **Select fields**: Chỉ select các fields cần thiết (bao gồm `password` và `googleId` để check)
7. **Compute flags**:
   - `hasPassword = !!user.password`
   - `hasGoogleAuth = !!user.googleId`
8. **Return safe data**: Exclude sensitive fields, return computed flags
9. **Auto-wrap response**: Response được wrap trong standard format bởi `ResponseInterceptor`

---

## Related Endpoints

- **PUT /users/password**: Change password (uses `hasPassword` để decide logic)
- **GET /users/sessions**: View active sessions
- **POST /auth/login**: Login endpoint
- **POST /auth/register**: Create account
- **GET /auth/google**: Link Google account

---

## Troubleshooting

### Problem: "User not found" error

**Cause**:

- User đã bị xóa từ database
- Token chứa invalid userId

**Solution**:

- Logout user và redirect to login
- Clear stored tokens
- User cần đăng ký lại

### Problem: Profile data không update

**Cause**:

- Frontend cache stale data
- Không refetch sau updates

**Solution**:

- Call refetch() sau mỗi update
- Implement cache invalidation
- Use SWR or React Query cho auto-revalidation

### Problem: Avatar không hiển thị

**Cause**:

- URL invalid hoặc expired
- CORS issues
- Google avatar URL expired

**Solution**:

- Check `user.avatar !== null`
- Use fallback image
- Handle image load errors:
  ```typescript
  <img
    src={user.avatar}
    onError={(e) => e.currentTarget.src = '/default-avatar.png'}
  />
  ```

### Problem: `hasPassword` và `hasGoogleAuth` đều false

**Cause**: Data inconsistency (không nên xảy ra)

**Solution**:

- Check database integrity
- User cần reset hoặc set password
- Contact support

---

## Notes

- **Read-only endpoint**: Chỉ GET, không modify data
- **No rate limiting**: Có thể call nhiều lần không giới hạn
- **Automatic wrapping**: Response được wrap bởi `ResponseInterceptor`
- **JWT required**: Không thể anonymous access
- **User-specific**: Chỉ return data của user hiện tại, không thể xem profile người khác
- **Computed fields**: `hasPassword` và `hasGoogleAuth` được compute runtime, không store trong DB
- **Nullable fields**: `fullName`, `username`, `avatar` có thể null - handle gracefully in frontend
