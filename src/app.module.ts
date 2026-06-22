import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { ChatModule } from '@/chat/chat.module';
import { AppController } from '@/app.controller';
import { TasksModule } from '@/tasks/tasks.module';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { HttpExceptionFilter } from '@/common/filters';
import { StorageModule } from '@/storage/storage.module';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PresenceModule } from '@/presence/presence.module';
import { VerificationModule } from '@/verification/verification.module';
import { ImageProcessingModule } from '@/image-processing/image-processing.module';

@Module({
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
  imports: [
    AuthModule,
    ChatModule,
    TasksModule,
    UsersModule,
    PrismaModule,
    StorageModule,
    PresenceModule,
    VerificationModule,
    ImageProcessingModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per ttl
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: { url: configService.get<string>('REDIS_URL') },
      }),
    }),
  ],
})
export class AppModule {}
