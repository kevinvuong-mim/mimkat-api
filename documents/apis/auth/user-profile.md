# User Profile API Documentation

## Overview

API lấy thông tin profile đầy đủ của người dùng hiện tại dựa trên JWT token. Bao gồm thông tin về phương thức đăng nhập (`hasPassword`, `hasGoogleAuth`) để hỗ trợ logic frontend.

**Base URL**: `/auth`

---

## Endpoint

### Get Current User Profile (Lấy thông tin profile đầy đủ)

Lấy thông tin profile đầy đủ của user đang đăng nhập, bao gồm `hasPassword` và `hasGoogleAuth` để xác định phương thức đăng nhập.

**Endpoint**: `GET /auth/me`
**Authentication**: Required (Bearer Token)

#### Headers

```
Authorization: Bearer {accessToken}
```

#### Response

**Success (200 OK)**

```json
{
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
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

- **401 Unauthorized**: User không tồn tại

```json
{
  "statusCode": 401,
  "message": "User not found",
  "error": "Unauthorized"
}
```

#### cURL Example

```bash
curl -X GET http://localhost:3000/auth/me \
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

---

## JWT Token Payload

### Access Token Structure

```json
{
  "sub": "clx1234567890abcdefghij",
  "iat": 1699286400,
  "exp": 1699290000
}
```

| Field | Type   | Description                      |
| ----- | ------ | -------------------------------- |
| sub   | string | Subject (User ID)                |
| iat   | number | Issued At (Unix timestamp)       |
| exp   | number | Expiration Time (Unix timestamp) |

### User Payload (from decorator)

Được extract bởi `@CurrentUser()` decorator:

```typescript
interface UserPayload {
  id: string; // User ID
  email: string; // Email
  fullName: string; // Full name
  username: string; // Username
  isActive: boolean; // Account status
}
```

---

## Frontend Integration

### Simple Usage

```typescript
'use client';

import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatar: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  hasPassword: boolean;
  hasGoogleAuth: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const accessToken = localStorage.getItem('accessToken');

    try {
      const response = await fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token invalid or expired, redirect to login
        localStorage.clear();
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {user.email}</p>
      <p>Name: {user.fullName || 'Not set'}</p>
      <p>Username: {user.username || 'Not set'}</p>
      <p>Status: {user.isActive ? 'Active' : 'Disabled'}</p>
      <p>Email Verified: {user.isEmailVerified ? 'Yes' : 'No'}</p>
      <p>Has Password: {user.hasPassword ? 'Yes' : 'No (Google only)'}</p>
      <p>Has Google Auth: {user.hasGoogleAuth ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### With React Context

```typescript
// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatar: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  hasPassword: boolean;
  hasGoogleAuth: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token invalid, clear storage
        localStorage.clear();
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Protected Route Component

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
```

---

## Use Cases

### 1. Display User Info

**Use Case**: Hiển thị thông tin user trong header/navbar

```typescript
function UserMenu() {
  const { user } = useAuth();

  return (
    <div>
      {user && (
        <div>
          <span>{user.email}</span>
          <span>{user.fullName}</span>
        </div>
      )}
    </div>
  );
}
```

### 2. Route Protection

**Use Case**: Chỉ cho phép user đã login truy cập

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard content</div>
    </ProtectedRoute>
  );
}
```

### 3. Conditional Rendering

**Use Case**: Hiển thị nội dung khác nhau cho user đã/chưa login

```typescript
function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {user ? (
        <div>Welcome back, {user.fullName}!</div>
      ) : (
        <div>Please login to continue</div>
      )}
    </div>
  );
}
```

### 4. Account Status Check

**Use Case**: Kiểm tra tài khoản có bị disabled không

```typescript
function AccountStatus() {
  const { user } = useAuth();

  if (!user) return null;

  if (!user.isActive) {
    return (
      <div className="alert alert-error">
        Your account has been disabled. Please contact support.
      </div>
    );
  }

  return null;
}
```

---

## Token Expiry Handling

### Auto Refresh on 401

Khi access token hết hạn, frontend nên tự động refresh:

```typescript
// api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        const response = await axios.post('/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

---

## Security Considerations

### What's Included

- ✅ User ID
- ✅ Email
- ✅ Full name
- ✅ Username
- ✅ Account status (isActive)

### What's NOT Included

- ❌ Password (hashed or plain)
- ❌ Refresh token
- ❌ Verification tokens
- ❌ Reset tokens
- ❌ Google ID
- ❌ Provider information
- ❌ Created/Updated timestamps
- ❌ Session information

### Best Practices

1. **Token in headers**: Luôn gửi token qua Authorization header (không dùng query params)
2. **HTTPS only**: Chỉ sử dụng HTTPS trong production
3. **Token expiry**: Access token có thời gian sống ngắn (1 giờ)
4. **Auto logout**: Tự động logout khi token hết hạn và refresh failed
5. **Minimal data**: Chỉ trả về thông tin cần thiết

---

## Performance Optimization

### Caching Strategy

```typescript
// Cache user data in memory
let cachedUser: User | null = null;
let cacheExpiry: number = 0;

async function getCurrentUser(): Promise<User | null> {
  // Return cached data if still valid
  if (cachedUser && Date.now() < cacheExpiry) {
    return cachedUser;
  }

  // Fetch fresh data
  const response = await fetch('/auth/me', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (response.ok) {
    cachedUser = await response.json();
    cacheExpiry = Date.now() + 5 * 60 * 1000; // Cache for 5 minutes
    return cachedUser;
  }

  return null;
}
```

### SWR Hook

```typescript
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function useCurrentUser() {
  const { data, error, mutate } = useSWR('/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    user: data,
    loading: !error && !data,
    error,
    refreshUser: mutate,
  };
}
```

---

## Related APIs

- [Authentication](./authentication.md) - Login để lấy access token
- [Session Management](./session-management.md) - Quản lý phiên đăng nhập
- [Google OAuth](./google-oauth.md) - Login bằng Google
