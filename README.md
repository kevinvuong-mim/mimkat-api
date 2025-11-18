# Mimkat API

API backend cho ứng dụng Mimkat được xây dựng với NestJS framework.

## Mô tả

Mimkat API là một REST API server cung cấp hệ thống xác thực và quản lý người dùng hoàn chỉnh, hỗ trợ:

- 🔐 **Authentication**: Email/Password và Google OAuth 2.0
- 👤 **User Management**: Profile, password change, session management
- ✉️ **Email Verification**: Xác thực email và password reset
- 🔒 **Security**: JWT tokens, bcrypt hashing, rate limiting
- 📱 **Multi-Device**: Quản lý phiên đăng nhập đa thiết bị
- 🍪 **Dual Auth Support**: Bearer tokens và HttpOnly cookies

## Công nghệ sử dụng

- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: Prisma ORM
- **Authentication**: Passport.js (JWT, Google OAuth2, Local)
- **Validation**: class-validator, class-transformer
- **Email**: Nodemailer
- **Security**: bcrypt, @nestjs/throttler

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Cấu hình biến môi trường
# Tạo file .env từ .env.example và cập nhật các giá trị phù hợp
cp .env.example .env

# Chạy Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

## Biến môi trường

Tạo file `.env` với các biến sau:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mimkat"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Email
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM="noreply@mimkat.com"
APP_URL="http://localhost:3000"

# CORS
CORS_ORIGIN="http://localhost:3001, http://localhost:3002"

# Server
PORT=3000
NODE_ENV="development"

# Frontend URLs
FRONTEND_URL="http://localhost:3001"
```

## Chạy ứng dụng

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Cấu trúc dự án

```
mimkat-api/
├── src/
│   ├── auth/                                       # Authentication & Authorization Module
│   │   ├── constants/
│   │   │   └── auth.constants.ts                   # Auth constants (token expiration, cookie settings)
│   │   ├── dto/
│   │   │   ├── change-password.dto.ts              # Change password validation
│   │   │   ├── forgot-password.dto.ts              # Forgot password validation
│   │   │   ├── google-auth.dto.ts                  # Google OAuth data transfer
│   │   │   ├── login.dto.ts                        # Login validation
│   │   │   ├── refresh-token.dto.ts                # Refresh token validation
│   │   │   ├── register.dto.ts                     # Registration validation
│   │   │   ├── reset-password.dto.ts               # Reset password validation
│   │   │   └── session.dto.ts                      # Session data transfer
│   │   ├── guards/
│   │   │   ├── google-auth.guard.ts                # Google OAuth guard
│   │   │   └── jwt-auth.guard.ts                   # JWT authentication guard with @Public support
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts                  # Passport Google OAuth2 strategy
│   │   │   └── jwt.strategy.ts                     # Passport JWT strategy
│   │   ├── auth.controller.ts                      # Auth endpoints (login, register, OAuth, logout)
│   │   ├── auth.service.ts                         # Auth business logic
│   │   └── auth.module.ts
│   ├── user/                                       # User Management Module
│   │   ├── user.controller.ts                      # User profile, password change, session management
│   │   ├── user.service.ts                         # User business logic
│   │   └── user.module.ts
│   ├── verification/                               # Email Verification & Password Reset Module
│   │   ├── verification.controller.ts              # Verification endpoints
│   │   ├── verification.service.ts                 # Email verification & password reset logic
│   │   └── verification.module.ts
│   ├── mail/                                       # Email Service Module
│   │   ├── mail.service.ts                         # Nodemailer integration for sending emails
│   │   └── mail.module.ts
│   ├── tasks/                                      # Background Tasks & Cron Jobs Module
│   │   ├── cleanup.service.ts                      # Auto-cleanup unverified accounts & expired tokens
│   │   └── tasks.module.ts
│   ├── prisma/                                     # Prisma ORM Module
│   │   ├── prisma.service.ts                       # Prisma client singleton instance
│   │   └── prisma.module.ts
│   ├── common/                                     # Shared utilities, decorators & filters
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts           # @CurrentUser() decorator to extract user from JWT
│   │   │   └── public.decorator.ts                 # @Public() decorator to bypass JWT guard
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts            # Global HTTP exception filter
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts             # Response transformation interceptor
│   │   ├── interfaces/
│   │   │   └── response.interface.ts               # Standard API response interface
│   │   ├── utils/
│   │   │   ├── device.util.ts                      # Device info extraction (browser, OS, IP)
│   │   │   └── pagination.util.ts                  # Pagination helper utilities
│   │   └── index.ts                                # Barrel exports for common module
│   ├── app.controller.ts                           # Root controller
│   ├── app.controller.spec.ts                      # Root controller tests
│   ├── app.service.ts                              # Root service
│   ├── app.module.ts                               # Root module with global guards & filters
│   └── main.ts                                     # Application entry point (bootstrap)
├── prisma/
│   └── schema.prisma                               # Database schema (User, Session, PasswordReset)
├── documents/                                      # API Documentation
│   ├── apis/                                       # API endpoint documentation
│   │   ├── auth/
│   │   │   ├── authentication.md                   # Login, Register, Logout, Refresh Token APIs
│   │   │   └── google-oauth.md                     # Google OAuth 2.0 flow documentation
│   │   ├── users/
│   │   │   ├── change-password.md                  # Change password API
│   │   │   ├── session-management.md               # Session management APIs
│   │   │   └── user-profile.md                     # Get user profile API
│   │   └── verification/
│   │       ├── email-verification.md               # Email verification APIs
│   │       └── password-reset.md                   # Password reset flow APIs
│   └── guides/
│       └── environment-variables.md                # Environment variables setup guide
├── test/
│   ├── app.e2e-spec.ts                             # E2E tests
│   └── jest-e2e.json                               # Jest E2E configuration
├── .env                                            # Environment variables (gitignored)
├── .env.example                                    # Environment variables template
├── .gitignore                                      # Git ignore rules
├── eslint.config.mjs                               # ESLint configuration
├── nest-cli.json                                   # NestJS CLI configuration
├── package.json                                    # Dependencies & scripts
├── prisma.config.ts                                # Prisma configuration
├── tsconfig.json                                   # TypeScript configuration with path aliases
├── tsconfig.build.json                             # TypeScript build configuration
└── README.md                                       # This file
```

### Path Aliases

Dự án sử dụng TypeScript path aliases để import dễ dàng hơn:

- `@/*` → `src/*`
- `@auth/*` → `src/auth/*`
- `@common/*` → `src/common/*`
- `@mail/*` → `src/mail/*`
- `@prisma/*` → `src/prisma/*`
- `@tasks/*` → `src/tasks/*`
- `@user/*` → `src/user/*`
- `@verification/*` → `src/verification/*`

**Ví dụ:**

```typescript
import { UserService } from '@user/user.service';
import { PrismaService } from '@prisma/prisma.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
```

## Security Features

- **JWT Authentication**: Bảo vệ các endpoints với JWT tokens
- **Rate Limiting**: Giới hạn 10 requests/60s để tránh abuse
- **CORS**: Cấu hình CORS cho frontend
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS
- **Password Hashing**: Sử dụng bcrypt để hash passwords
- **Input Validation**: Validation với class-validator
- **SQL Injection Prevention**: Prisma ORM tự động escape queries

## Database

Dự án sử dụng Prisma ORM với PostgreSQL. Để quản lý database:

```bash
# Tạo migration mới
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Migration Workflow

**Development:**

1. Sửa `schema.prisma`
2. Chạy `npx prisma migrate dev --name descriptive_name`
3. Prisma sẽ tự động generate client và apply migration

**Production:**

1. Commit migration files vào Git
2. Deploy code
3. Chạy `npx prisma migrate deploy` trên production server

## Deployment

```bash
# Build application
npm run build

# Start production server
npm run start:prod
```

## Tài liệu API

### 📚 Hướng dẫn tổng quan

- [Environment Variables](./documents/guides/environment-variables.md) - Hướng dẫn cấu hình biến môi trường

### 🔐 Authentication APIs

- [Authentication](./documents/apis/auth/authentication.md) - Login, Register, Logout, Refresh Token
- [Google OAuth](./documents/apis/auth/google-oauth.md) - Google OAuth 2.0 integration

### 👤 User Management APIs

- [User Profile](./documents/apis/user/user-profile.md) - Lấy thông tin profile
- [Change Password](./documents/apis/user/change-password.md) - Đổi mật khẩu
- [Session Management](./documents/apis/user/session-management.md) - Quản lý phiên đăng nhập

### ✉️ Verification APIs

- [Email Verification](./documents/apis/verification/email-verification.md) - Xác thực email
- [Password Reset](./documents/apis/verification/password-reset.md) - Quên mật khẩu và reset

---

## Tài liệu tham khảo

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport.js Documentation](http://www.passportjs.org/docs)

## License

UNLICENSED - Private project
