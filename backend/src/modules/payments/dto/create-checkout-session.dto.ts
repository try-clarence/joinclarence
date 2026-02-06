import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl, IsUUID } from 'class-validator';

/**
 * DTO for creating a Stripe Checkout session
 */
export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Carrier quote ID to purchase',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  carrierQuoteId: string;

  @ApiPropertyOptional({
    description: 'URL to redirect to after successful payment',
    example: 'https://app.joinclarence.com/home/purchase/success',
  })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to redirect to if payment is cancelled',
    example: 'https://app.joinclarence.com/home/purchase/cancel',
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}

/**
 * Response DTO for checkout session creation
 */
export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'Stripe Checkout session ID',
    example: 'cs_test_a1b2c3d4e5f6g7h8i9j0',
  })
  sessionId: string;

  @ApiProperty({
    description: 'URL to redirect user to Stripe Checkout',
    example: 'https://checkout.stripe.com/c/pay/cs_test_...',
  })
  checkoutUrl: string;
}
