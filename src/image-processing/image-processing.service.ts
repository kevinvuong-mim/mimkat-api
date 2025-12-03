import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  private readonly MAX_DIMENSION = 1024;
  private readonly QUALITY = 80;
  private readonly ALLOWED_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  async processImage(file: Express.Multer.File): Promise<ProcessedImage> {
    // Validate mimetype
    if (!this.ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.',
      );
    }

    try {
      // Create Sharp instance (reuse to avoid memory leak)
      const sharpInstance = sharp(file.buffer);
      const metadata = await sharpInstance.metadata();

      this.logger.log(
        `Processing image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`,
      );

      // Validate image dimensions
      if (metadata.width < 50 || metadata.height < 50) {
        throw new BadRequestException(
          'Image too small. Minimum dimensions: 50x50 pixels.',
        );
      }

      // Validate aspect ratio (prevent banner-like images)
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 5 || aspectRatio < 0.2) {
        throw new BadRequestException(
          'Invalid aspect ratio. Image dimensions must be between 1:5 and 5:1.',
        );
      }

      // Handle GIF separately to preserve animation
      if (metadata.format === 'gif') {
        let processedBuffer: Buffer;

        if (
          metadata.width > this.MAX_DIMENSION ||
          metadata.height > this.MAX_DIMENSION
        ) {
          // Resize GIF while preserving animation
          processedBuffer = await sharpInstance
            .resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .gif()
            .toBuffer();
        } else {
          // Keep GIF as-is
          processedBuffer = file.buffer;
        }

        this.logger.log(
          `GIF processed: ${file.size} -> ${processedBuffer.length} bytes`,
        );

        return {
          buffer: processedBuffer,
          mimetype: 'image/gif',
          size: processedBuffer.length,
        };
      }

      // Process non-GIF images (convert to WebP)
      let processedBuffer: Buffer;

      if (
        metadata.width > this.MAX_DIMENSION ||
        metadata.height > this.MAX_DIMENSION
      ) {
        processedBuffer = await sharpInstance
          .resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
            fit: 'inside', // Maintain aspect ratio
            withoutEnlargement: true,
          })
          .webp({ quality: this.QUALITY })
          .toBuffer();
      } else {
        // Just convert to WebP and optimize
        processedBuffer = await sharpInstance
          .webp({ quality: this.QUALITY })
          .toBuffer();
      }

      this.logger.log(
        `Image processed: ${file.size} -> ${processedBuffer.length} bytes`,
      );

      return {
        buffer: processedBuffer,
        mimetype: 'image/webp',
        size: processedBuffer.length,
      };
    } catch (error) {
      // Handle out-of-memory errors specifically
      if (
        error.message?.includes('memory') ||
        error.message?.includes('allocation')
      ) {
        this.logger.error('Out of memory while processing image', error);
        throw new BadRequestException(
          'Image is too large to process. Please use a smaller file.',
        );
      }

      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Other errors
      this.logger.error('Failed to process image', error);
      throw new BadRequestException(
        'Failed to process image. File may be corrupted.',
      );
    }
  }
}
