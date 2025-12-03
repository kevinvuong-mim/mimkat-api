import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { IStorageService } from '../interfaces/storage.interface';

@Injectable()
export class S3Service implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    // Validate all required environment variables
    if (!region || !bucketName || !endpoint) {
      throw new Error(
        'AWS_REGION, AWS_BUCKET_NAME, and AWS_ENDPOINT are required in environment variables.',
      );
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS credentials are required. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.',
      );
    }

    this.region = region;
    this.bucketName = bucketName;

    this.s3Client = new S3Client({
      region: this.region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      // Check if bucket exists
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error) {
      // Provide specific error messages based on error type
      if (error.name === 'NoSuchBucket') {
        this.logger.error(
          `S3 bucket "${this.bucketName}" does not exist. Please create it first.`,
        );
      } else if (error.name === 'Forbidden') {
        this.logger.error(
          `Access denied to bucket "${this.bucketName}". Check IAM permissions.`,
        );
      } else {
        this.logger.error(
          `Failed to access S3 bucket "${this.bucketName}": ${error.message}`,
        );
      }
      throw error;
    }
  }

  async upload(file: Buffer, key: string, mimetype: string): Promise<string> {
    // Validate key format
    if (!key || key.trim() === '') {
      throw new Error('Storage key cannot be empty');
    }

    if (key.includes('..')) {
      throw new Error('Storage key cannot contain path traversal');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: mimetype,
      });

      await this.s3Client.send(command);

      // Return encoded key instead of public URL
      const encodedKey = encodeURI(key);
      this.logger.log(`File uploaded successfully: ${key}`);

      return encodedKey;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, {
        key,
        bucketName: this.bucketName,
        region: this.region,
        stack: error.stack,
      });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file from S3: ${error.message}`, {
        key,
        bucketName: this.bucketName,
        region: this.region,
      });
    }
  }
}
