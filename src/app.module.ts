import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { TasksModule } from '@/tasks/tasks.module';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { StorageModule } from '@/storage/storage.module';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { VerificationModule } from '@/verification/verification.module';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { ImageProcessingModule } from '@/image-processing/image-processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per ttl
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    VerificationModule,
    TasksModule,
    StorageModule,
    ImageProcessingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
