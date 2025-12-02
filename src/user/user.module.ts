import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '@prisma/prisma.module';
import { StorageModule } from '@storage/storage.module';
import { ImageProcessingModule } from '@image-processing/image-processing.module';

@Module({
  imports: [PrismaModule, StorageModule, ImageProcessingModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
