import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentPlan } from '@/common/enums';

export class RenewPolicyDto {
  @ApiPropertyOptional({
    description: 'Payment plan for the renewed policy',
    enum: PaymentPlan,
    enumName: 'PaymentPlan',
    example: PaymentPlan.ANNUAL,
  })
  @IsOptional()
  @IsEnum(PaymentPlan)
  paymentPlan?: PaymentPlan;

  @ApiPropertyOptional({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the renewal',
    example: 'Renewing with same coverage',
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
