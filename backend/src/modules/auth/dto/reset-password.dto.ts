import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches, Length } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  resetId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number or special character',
  })
  newPassword: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty()
  message: string;
}
