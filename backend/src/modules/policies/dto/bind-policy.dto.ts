import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentPlan } from '@/common/enums';

export class BindPolicyDto {
  @ApiProperty({
    description: 'ID of the carrier quote to bind',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  carrierQuoteId: string;

  @ApiProperty({
    description: 'Payment plan for the policy',
    enum: PaymentPlan,
    enumName: 'PaymentPlan',
    example: PaymentPlan.ANNUAL,
  })
  @IsEnum(PaymentPlan)
  paymentPlan: PaymentPlan;

  @ApiPropertyOptional({
    description: 'Whether to enable auto-renewal',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @ApiPropertyOptional({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the policy',
    example: 'Please contact me before renewal',
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
