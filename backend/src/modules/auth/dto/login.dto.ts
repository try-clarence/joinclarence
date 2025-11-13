import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+14155551234' })
  @IsString()
  @Matches(/^\+1\d{10}$/, {
    message: 'Phone must be a valid US number in format +1XXXXXXXXXX',
  })
  phone: string;

  @ApiProperty()
  @IsString()
  password: string;
}
