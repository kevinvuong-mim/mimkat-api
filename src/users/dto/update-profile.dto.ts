import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9]([._](?![._])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/, {
    message:
      'Username must start and end with a letter or number, contain only letters, numbers, dots, and underscores, and cannot have consecutive special characters',
  })
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+\-\s()]*$/, {
    message:
      'Phone number can only contain numbers, +, -, spaces, and parentheses',
  })
  @MinLength(10, {
    message: 'Phone number must be at least 10 characters long',
  })
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phoneNumber?: string;
}
