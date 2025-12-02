import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@auth/auth.module';
import { UserModule } from '@user/user.module';
import { VerificationModule } from '@verification/verification.module';
import { TasksModule } from '@tasks/tasks.module';
import { StorageModule } from '@storage/storage.module';
import { ImageProcessingModule } from '@image-processing/image-processing.module';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';

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
    UserModule,
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
