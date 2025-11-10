import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, IsEnum, IsOptional } from 'class-validator';

export enum VerificationPurpose {
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password-reset',
}

export class SendVerificationCodeDto {
  @ApiProperty({ example: '+14155551234' })
  @IsString()
  @Matches(/^\+1\d{10}$/, {
    message: 'Phone must be a valid US number in format +1XXXXXXXXXX',
  })
  phone: string;

  @ApiProperty({ enum: VerificationPurpose, default: VerificationPurpose.REGISTRATION })
  @IsEnum(VerificationPurpose)
  @IsOptional()
  purpose?: VerificationPurpose = VerificationPurpose.REGISTRATION;
}

export class SendVerificationCodeResponseDto {
  @ApiProperty()
  verificationId: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  message: string;
}

