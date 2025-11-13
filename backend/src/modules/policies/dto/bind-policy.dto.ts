import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export enum PaymentPlan {
  ANNUAL = 'annual',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export class BindPolicyDto {
  @IsUUID()
  carrierQuoteId: string;

  @IsUUID()
  userId: string;

  @IsEnum(PaymentPlan)
  paymentPlan: PaymentPlan;

  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @IsOptional()
  @IsString()
  paymentMethodId?: string; // Stripe payment method ID

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
