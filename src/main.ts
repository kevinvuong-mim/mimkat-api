import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Cookie parser - MUST be before routes
  app.use(cookieParser());

  // Helmet - Security headers middleware
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    }),
  );

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS with cookie support
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(', ').filter(Boolean)
      : ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true, // Critical for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Client-Type',
      'X-CSRF-Token',
    ],
  });

  // Global validation pipe với whitelist để tránh mass assignment
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties không có decorator
      forbidNonWhitelisted: true, // Throw error nếu có property không mong muốn
      transform: true, // Tự động transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Request size limit - Express default là 100kb
  // Có thể config trong NestFactory.create nếu cần tăng:
  // app.use(express.json({ limit: '10mb' }));
  // app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Compression - Enable response compression
  app.use(
    compression({
      threshold: 1024, // Chỉ compress response > 1KB
      level: 6, // Compression level (0-9)
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err);
  process.exit(1);
});
