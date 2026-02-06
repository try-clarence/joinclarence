import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod, PaymentType } from '@/common/enums';

/**
 * DTO representing a payment
 */
export class PaymentDto {
  @ApiProperty({
    description: 'Payment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Policy ID this payment is for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  policyId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 5000,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiPropertyOptional({
    description: 'Payment due date',
    example: '2024-02-01',
  })
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'When the payment was made',
    example: '2024-01-15T10:30:00Z',
  })
  paidAt?: Date;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    enumName: 'PaymentStatus',
    example: PaymentStatus.SUCCEEDED,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    enumName: 'PaymentType',
    example: PaymentType.INITIAL,
  })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
    example: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Last 4 digits of payment method',
    example: '4242',
  })
  paymentMethodLast4?: string;

  @ApiPropertyOptional({
    description: 'Receipt URL',
    example: 'https://receipt.stripe.com/...',
  })
  receiptUrl?: string;

  @ApiProperty({
    description: 'When the payment record was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the payment record was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
