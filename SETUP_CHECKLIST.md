# 🚀 Google OAuth Setup Checklist

## ✅ Backend Setup

### 1. Dependencies

- [x] Installed `passport-google-oauth20`
- [x] Installed `@types/passport-google-oauth20`
- [x] Updated `package.json`

### 2. Database

- [x] Updated Prisma schema với Google OAuth fields
- [x] Created migration: `add_google_oauth_fields`
- [x] Applied migration to database
- [x] Generated Prisma Client

### 3. Code Implementation

- [x] Created `GoogleStrategy` (`src/auth/strategies/google.strategy.ts`)
- [x] Created `GoogleAuthGuard` (`src/auth/guards/google-auth.guard.ts`)
- [x] Created `GoogleAuthDto` (`src/auth/dto/google-auth.dto.ts`)
- [x] Updated `AuthService` với `googleLogin()` method
- [x] Updated `AuthController` với Google OAuth routes
- [x] Updated `AuthModule` để register GoogleStrategy
- [x] Fixed password validation cho OAuth users

### 4. Configuration Files

- [x] Created `.env.example` với Google OAuth variables
- [ ] **TODO: Update `.env` với real Google credentials**

### 5. Documentation

- [x] Created `GOOGLE_OAUTH_SETUP.md` - Chi tiết setup guide
- [x] Created `README_GOOGLE_OAUTH.md` - Comprehensive README
- [x] Created `FRONTEND_INTEGRATION.md` - Frontend integration guide
- [x] Created `test-google-oauth.html` - Testing page

## 📋 Google Cloud Console Setup

### Required Steps

- [ ] **TODO: Create project trong Google Cloud Console**
- [ ] **TODO: Enable Google+ API**
- [ ] **TODO: Create OAuth 2.0 Client ID**
- [ ] **TODO: Add Authorized redirect URIs:**
  - Development: `http://localhost:3000/auth/google/callback`
  - Production: `https://api.yourdomain.com/auth/google/callback`
- [ ] **TODO: Copy Client ID và Client Secret vào `.env`**

### Google Console Settings

```
Application Type: Web application
Authorized JavaScript origins:
  - http://localhost:3000 (Development)
  - https://yourdomain.com (Production)

Authorized redirect URIs:
  - http://localhost:3000/auth/google/callback (Development)
  - https://api.yourdomain.com/auth/google/callback (Production)
```

## 🔧 Environment Variables to Configure

Update `.env` file:

```env
# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Existing variables
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
```

## 🧪 Testing Steps

### Backend Testing

1. [ ] Start server: `npm run start:dev`
2. [ ] Open browser: `http://localhost:3000/auth/google`
3. [ ] Should redirect to Google login page
4. [ ] Login with Google account
5. [ ] Should redirect to callback with tokens
6. [ ] Check database for new user record

### Frontend Testing

1. [ ] Open `test-google-oauth.html` in browser
2. [ ] Click "Continue with Google"
3. [ ] Verify successful authentication
4. [ ] Check localStorage for tokens

## 🎯 Frontend Integration Tasks

### For Frontend Developers

- [ ] Choose integration approach (Redirect/Popup/React OAuth)
- [ ] Implement "Sign in with Google" button
- [ ] Handle authentication callback
- [ ] Store tokens (localStorage/cookies)
- [ ] Implement token refresh logic
- [ ] Add error handling
- [ ] Test complete flow

### Files to Share with Frontend Team

- ✅ `FRONTEND_INTEGRATION.md` - Complete guide
- ✅ `test-google-oauth.html` - Working example
- ✅ API endpoint documentation

## 📡 API Endpoints

### Google OAuth Flow

```
GET  /auth/google           - Initiate Google login
GET  /auth/google/callback  - Google callback (automatic)
```

### Traditional Auth (Still works!)

```
POST /auth/register         - Register with email/password
POST /auth/login            - Login with email/password
POST /auth/refresh          - Refresh access token
POST /auth/logout           - Logout
GET  /auth/sessions         - Get active sessions
DELETE /auth/sessions       - Logout all devices
DELETE /auth/sessions/:id   - Logout specific device
```

## 🔒 Security Checklist

- [x] Passwords are optional (nullable) for OAuth users
- [x] Password field properly validated in login
- [x] Google OAuth uses state parameter (handled by Passport)
- [x] Tokens properly generated with JWT
- [x] Session tracking with device info
- [ ] **TODO: Enable CORS for frontend domain**
- [ ] **TODO: Setup HTTPS in production**
- [ ] **TODO: Use httpOnly cookies for tokens (recommended)**

## 📦 Database Schema Changes

### User Table Updates

```prisma
model User {
  // New fields
  password  String?   // Now optional
  googleId  String?   @unique
  avatar    String?
  provider  String?   @default("local")
}
```

### Migration Applied

```sql
-- Add new columns
ALTER TABLE users ADD COLUMN google_id VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN avatar VARCHAR;
ALTER TABLE users ADD COLUMN provider VARCHAR DEFAULT 'local';
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

## 🚀 Deployment Checklist

### Production Setup

- [ ] Update `GOOGLE_CALLBACK_URL` to production URL
- [ ] Add production redirect URI to Google Console
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure CORS for production frontend domain
- [ ] Update DATABASE_URL for production
- [ ] Set secure JWT secrets
- [ ] Enable rate limiting
- [ ] Setup monitoring/logging
- [ ] Test complete OAuth flow in production

## 📝 Notes

### Important Points

1. **Account Linking**: Nếu user đã có account với email, Google login sẽ tự động link
2. **Password Required**: Local login users phải có password
3. **OAuth Users**: Users login bằng Google không có password
4. **Session Management**: Mỗi login tạo session mới với device tracking
5. **Token Rotation**: Refresh token được rotate mỗi lần refresh

### Known Limitations

- Google OAuth chỉ support trong browser (không support mobile native apps)
- Cần Google Cloud Console account để setup
- Redirect-based flow (không phải popup nếu dùng Passport default)

## 🆘 Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch"**
   - Solution: Check Google Console redirect URI matches exactly

2. **"Invalid client"**
   - Solution: Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

3. **CORS errors**
   - Solution: Enable CORS in NestJS for frontend domain

4. **TypeScript errors**
   - Solution: Run `npx prisma generate` to regenerate client

### Debug Commands

```bash
# Regenerate Prisma Client
npx prisma generate

# Rebuild project
npm run build

# Check migrations
npx prisma migrate status

# View database
npx prisma studio
```

## ✨ Next Steps

### Immediate

1. [ ] Get Google OAuth credentials from Google Cloud Console
2. [ ] Update `.env` với real credentials
3. [ ] Test complete flow
4. [ ] Share integration guide với frontend team

### Optional Enhancements

- [ ] Add Facebook OAuth
- [ ] Add GitHub OAuth
- [ ] Add Apple Sign In
- [ ] Implement email verification
- [ ] Add 2FA support
- [ ] Add password reset flow

## 📚 Resources

- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
- [Complete README](./README_GOOGLE_OAUTH.md)
- [Test Page](./test-google-oauth.html)
- [Google Cloud Console](https://console.cloud.google.com/)
- [NestJS Passport Docs](https://docs.nestjs.com/security/authentication)
- [Passport Google OAuth20](http://www.passportjs.org/packages/passport-google-oauth20/)

---

**Status**: ✅ Backend implementation complete - Ready for Google credentials
**Next Action**: Get Google OAuth credentials and test
