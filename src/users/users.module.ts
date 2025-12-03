import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '@prisma/prisma.module';
import { StorageModule } from '@storage/storage.module';
import { ImageProcessingModule } from '@image-processing/image-processing.module';

@Module({
  imports: [PrismaModule, StorageModule, ImageProcessingModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
