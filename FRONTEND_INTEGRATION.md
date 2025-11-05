# Frontend Integration Guide - Google OAuth

## 🎯 Tóm tắt nhanh

Backend API đã có 2 endpoint chính cho Google OAuth:

- `GET /auth/google` - Bắt đầu flow đăng nhập Google
- `GET /auth/google/callback` - Callback sau khi Google xác thực

## 🚀 Quick Start cho Frontend

### Cách đơn giản nhất (Redirect)

```javascript
// Khi user click "Sign in with Google"
function handleGoogleLogin() {
  window.location.href = 'http://localhost:3000/auth/google';
}
```

Sau khi đăng nhập thành công, backend sẽ trả về tokens.

## 📦 Response Format

```json
{
  "message": "Google login successful",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "fullName": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 💡 Implementation Options

### Option 1: Simple Redirect (Easiest)

**Ưu điểm:** Đơn giản, không cần library
**Nhược điểm:** Phải handle redirect flow

```html
<button onclick="window.location.href='http://localhost:3000/auth/google'">
  Sign in with Google
</button>
```

### Option 2: Popup Window

**Ưu điểm:** User không leave trang hiện tại
**Nhược điểm:** Cần handle popup và postMessage

```javascript
function openGoogleLogin() {
  const popup = window.open(
    'http://localhost:3000/auth/google',
    'Google Login',
    'width=500,height=600',
  );

  window.addEventListener('message', (event) => {
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      const { accessToken, refreshToken } = event.data;
      // Store tokens and redirect
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      window.location.href = '/dashboard';
    }
  });
}
```

### Option 3: React với @react-oauth/google

```bash
npm install @react-oauth/google
```

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  const handleSuccess = async (credentialResponse) => {
    // Send Google token to your backend
    const response = await fetch('http://localhost:3000/auth/google/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credentialResponse.credential }),
    });

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.log('Login Failed')}
      />
    </GoogleOAuthProvider>
  );
}
```

## 🔄 Complete Flow Example (React)

```jsx
// LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Handle callback from Google OAuth
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const handleGoogleLogin = () => {
    setLoading(true);
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        navigate('/dashboard');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>

      {/* Local Login Form */}
      <form onSubmit={handleLocalLogin}>
        <input name="email" type="email" placeholder="Email" required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>

      <div className="divider">OR</div>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="google-btn"
      >
        {loading ? 'Redirecting...' : '🔐 Continue with Google'}
      </button>
    </div>
  );
}
```

## 🎨 Styled Google Button

```jsx
// GoogleLoginButton.jsx
export default function GoogleLoginButton() {
  const handleClick = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px',
        background: 'white',
        border: '1px solid #dadce0',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Sign in with Google
    </button>
  );
}
```

## 🔐 Using Tokens

Sau khi có tokens, sử dụng accessToken để gọi protected endpoints:

```javascript
// api.js
const API_URL = 'http://localhost:3000';

export async function fetchProtectedData() {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(`${API_URL}/protected-route`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    // Token expired, refresh it
    await refreshToken();
    return fetchProtectedData(); // Retry
  }

  return response.json();
}

export async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  } else {
    // Refresh failed, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
}
```

## 📱 Next.js App Router Example

```tsx
// app/login/page.tsx
'use client';

export default function LoginPage() {
  return (
    <button
      onClick={() => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
      }}
    >
      Sign in with Google
    </button>
  );
}

// app/auth/callback/page.tsx
('use client');

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  return <div>Processing authentication...</div>;
}
```

## 🌐 Environment Variables

```env
# .env.local (Frontend)
REACT_APP_API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000
```

## ⚠️ Important Notes

1. **CORS**: Backend phải enable CORS cho frontend domain của bạn
2. **HTTPS**: Production phải dùng HTTPS
3. **Token Storage**:
   - Development: localStorage OK
   - Production: Nên dùng httpOnly cookies
4. **Error Handling**: Always handle expired/invalid tokens

## 🧪 Testing

1. Open `test-google-oauth.html` trong browser
2. Click "Continue with Google"
3. Login với Google account
4. Check console for tokens

## 📞 Support

Nếu gặp vấn đề:

1. Check CORS settings
2. Verify Google Client ID trong Google Console
3. Check redirect URI matches exactly
4. Check browser console for errors
