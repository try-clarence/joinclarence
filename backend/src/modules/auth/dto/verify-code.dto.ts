import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty()
  @IsString()
  verificationId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class VerifyCodeResponseDto {
  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  verificationToken: string;

  @ApiProperty()
  expiresAt: string;
}

