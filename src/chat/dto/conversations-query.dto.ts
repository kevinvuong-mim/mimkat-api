import { Type } from 'class-transformer';
import { Max, Min, IsInt, IsUUID, IsOptional } from 'class-validator';

export class ConversationsQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
