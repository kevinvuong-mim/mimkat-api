import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { S3Service } from './providers/s3.service';

@Module({
  providers: [StorageService, S3Service],
  exports: [StorageService],
})
export class StorageModule {}
