import { Injectable } from '@nestjs/common';
import { IStorageService } from './interfaces/storage.interface';
import { S3Service } from './providers/s3.service';

@Injectable()
export class StorageService implements IStorageService {
  private provider: IStorageService;

  constructor(private s3Service: S3Service) {
    this.provider = this.s3Service;
  }

  async initialize(): Promise<void> {
    return this.provider.initialize();
  }

  async upload(file: Buffer, key: string, mimetype: string): Promise<string> {
    return this.provider.upload(file, key, mimetype);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }
}
