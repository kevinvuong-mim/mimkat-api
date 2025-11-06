# Mimkat API

API backend cho ứng dụng Mimkat được xây dựng với NestJS framework.

## Mô tả

Mimkat API là một REST API server cung cấp các chức năng:

- **Authentication & Authorization**: Hệ thống xác thực JWT với Google OAuth2
- **Task Management**: Quản lý công việc và nhiệm vụ
- **Email Service**: Gửi email thông báo
- **Security**: Rate limiting, CORS, và các security headers
- **Database**: Prisma ORM với PostgreSQL

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
│   ├── auth/           # Module xác thực (JWT, Google OAuth, Local)
│   ├── tasks/          # Module quản lý công việc
│   ├── mail/           # Module gửi email
│   ├── prisma/         # Prisma service và module
│   ├── common/         # Shared utilities, filters, guards
│   ├── app.module.ts   # Root module
│   └── main.ts         # Entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── test/               # E2E tests
└── dist/               # Build output
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

## Deployment

```bash
# Build application
npm run build

# Start production server
npm run start:prod
```

## Tài liệu tham khảo

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport.js Documentation](http://www.passportjs.org/docs)

## License

UNLICENSED - Private project
