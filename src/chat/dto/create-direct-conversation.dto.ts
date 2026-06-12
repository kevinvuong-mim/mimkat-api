import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDirectConversationDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  participantEmail: string;
}
