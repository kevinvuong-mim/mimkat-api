import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @Transform(({ value }: { value: string[] }) =>
    Array.isArray(value)
      ? value.map((email) => (typeof email === 'string' ? email.trim().toLowerCase() : email))
      : value,
  )
  memberEmails: string[];
}
