import { MessageType } from '@prisma/client';
import { IsEnum, IsUUID, IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class WsChatSendDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
