import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  Matches,
  IsEmail,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  verificationToken: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number or special character',
  })
  password: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
  };

  @ApiProperty()
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
