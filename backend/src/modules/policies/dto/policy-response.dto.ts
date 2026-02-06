import {
  CoverageType,
  InsuranceType,
  PaymentMethod,
  PaymentPlan,
  PaymentStatus,
  PolicyActivityType,
  PolicyDocumentType,
  PolicyStatus,
} from '@/common/enums';
import { CoverageLimitsDto } from '@/common/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO representing a policy activity/history entry
 */
export class PolicyActivityDto {
  @ApiProperty({
    description: 'Activity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Policy ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  policyId: string;

  @ApiProperty({
    description: 'Activity type',
    enum: PolicyActivityType,
    enumName: 'PolicyActivityType',
    example: PolicyActivityType.CREATED,
  })
  type: PolicyActivityType;

  @ApiProperty({
    description: 'Activity description',
    example: 'Policy created and bound',
  })
  description: string;

  @ApiProperty({
    description: 'When the activity occurred',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata for the activity',
    example: { previousStatus: 'active', newStatus: 'cancelled' },
  })
  metadata?: Record<string, unknown>;
}

/**
 * DTO representing a policy document
 */
export class PolicyDocumentDto {
  @ApiProperty({
    description: 'Document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Policy ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  policyId: string;

  @ApiProperty({
    description: 'Document name',
    example: 'Policy Declaration',
  })
  name: string;

  @ApiProperty({
    description: 'Document type',
    enum: PolicyDocumentType,
    enumName: 'PolicyDocumentType',
    example: PolicyDocumentType.POLICY_DOCUMENT,
  })
  type: PolicyDocumentType;

  @ApiProperty({
    description: 'Document URL',
    example: 'https://example.com/documents/policy.pdf',
  })
  url: string;

  @ApiProperty({
    description: 'When the document was uploaded',
    example: '2024-01-15T10:30:00Z',
  })
  uploadedAt: Date;

  @ApiPropertyOptional({
    description: 'Document file size in bytes',
    example: 102400,
  })
  size?: number;
}

/**
 * DTO representing a policy payment
 */
export class PolicyPaymentDto {
  @ApiProperty({
    description: 'Payment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Policy ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  policyId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 5000,
  })
  amount: number;

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

  @ApiPropertyOptional({
    description: 'Payment method used',
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
    example: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod?: PaymentMethod;
}

/**
 * DTO representing carrier contact info
 */
export class CarrierContactInfoDto {
  @ApiPropertyOptional({
    description: 'Contact phone',
    example: '+18005551234',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'support@acmeinsurance.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Claims phone',
    example: '+18005554321',
  })
  claimsPhone?: string;
}

/**
 * DTO representing a policy
 */
export class PolicyDto {
  @ApiProperty({
    description: 'Policy ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Quote request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  quoteRequestId: string;

  @ApiProperty({
    description: 'Carrier quote ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  carrierQuoteId: string;

  @ApiProperty({
    description: 'Carrier ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  carrierId: string;

  @ApiProperty({
    description: 'Policy number',
    example: 'POL-2024-001234',
  })
  policyNumber: string;

  @ApiProperty({
    description: 'Carrier policy ID',
    example: 'CP-12345',
  })
  carrierPolicyId: string;

  @ApiPropertyOptional({
    description: 'Carrier bind ID',
    example: 'BIND-12345',
  })
  carrierBindId?: string;

  @ApiProperty({
    description: 'Insurance type',
    enum: InsuranceType,
    enumName: 'InsuranceType',
    example: InsuranceType.COMMERCIAL,
  })
  insuranceType: InsuranceType;

  @ApiProperty({
    description: 'Coverage type',
    enum: CoverageType,
    enumName: 'CoverageType',
    example: CoverageType.GENERAL_LIABILITY,
  })
  coverageType: CoverageType;

  @ApiProperty({
    description: 'Policy status',
    enum: PolicyStatus,
    enumName: 'PolicyStatus',
    example: PolicyStatus.ACTIVE,
  })
  status: PolicyStatus;

  @ApiProperty({
    description: 'Coverage limits',
    type: () => CoverageLimitsDto,
    example: { perOccurrence: 1000000, aggregate: 2000000 },
  })
  coverageLimits: CoverageLimitsDto;

  @ApiProperty({
    description: 'Deductible amount',
    example: 1000,
  })
  deductible: number;

  @ApiProperty({
    description: 'Annual premium',
    example: 5000,
  })
  annualPremium: number;

  @ApiProperty({
    description: 'Payment plan',
    enum: PaymentPlan,
    enumName: 'PaymentPlan',
    example: PaymentPlan.ANNUAL,
  })
  paymentPlan: PaymentPlan;

  @ApiPropertyOptional({
    description: 'Monthly amount if monthly payment plan',
    example: 450,
  })
  monthlyAmount?: number;

  @ApiProperty({
    description: 'Policy effective date',
    example: '2024-02-01',
  })
  effectiveDate: Date;

  @ApiProperty({
    description: 'Policy expiration date',
    example: '2025-02-01',
  })
  expirationDate: Date;

  @ApiProperty({
    description: 'When the policy was bound',
    example: '2024-01-15T10:30:00Z',
  })
  boundAt: Date;

  @ApiPropertyOptional({
    description: 'When the policy was cancelled',
    example: '2024-06-15T10:30:00Z',
  })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Insured name',
    example: 'Acme Corporation',
  })
  insuredName: string;

  @ApiProperty({
    description: 'Insured address',
    example: '123 Main St, San Francisco, CA 94105',
  })
  insuredAddress: string;

  @ApiPropertyOptional({
    description: 'First payment due date',
    example: '2024-02-01',
  })
  firstPaymentDue?: Date;

  @ApiPropertyOptional({
    description: 'Next payment date',
    example: '2024-03-01',
  })
  nextPaymentDate?: Date;

  @ApiPropertyOptional({
    description: 'Number of payments remaining',
    example: 11,
  })
  paymentsRemaining?: number;

  @ApiProperty({
    description: 'Whether auto-renewal is enabled',
    example: true,
  })
  autoRenewal: boolean;

  @ApiPropertyOptional({
    description: 'URL to policy document',
    example: 'https://example.com/policy.pdf',
  })
  policyDocumentUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to declarations page',
    example: 'https://example.com/declarations.pdf',
  })
  declarationsUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to certificate of insurance',
    example: 'https://example.com/certificate.pdf',
  })
  certificateUrl?: string;

  @ApiPropertyOptional({
    description: 'Carrier name (populated from carrier relation)',
    example: 'Acme Insurance',
  })
  carrierName?: string;

  @ApiPropertyOptional({
    description: 'Carrier contact information',
    type: () => CarrierContactInfoDto,
  })
  carrierContactInfo?: CarrierContactInfoDto;

  @ApiPropertyOptional({
    description: 'Payment history for this policy',
    type: () => [PolicyPaymentDto],
  })
  payments?: PolicyPaymentDto[];

  @ApiPropertyOptional({
    description: 'Activity history for this policy',
    type: () => [PolicyActivityDto],
  })
  activities?: PolicyActivityDto[];

  @ApiPropertyOptional({
    description: 'Documents associated with this policy',
    type: () => [PolicyDocumentDto],
  })
  documents?: PolicyDocumentDto[];

  @ApiProperty({
    description: 'When the policy was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the policy was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * Response DTO for bind/renew policy operations that include a transaction ID
 */
export class BindPolicyResponseDto {
  @ApiProperty({
    description: 'The bound policy',
    type: () => PolicyDto,
  })
  policy: PolicyDto;

  @ApiProperty({
    description: 'Payment transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  transactionId: string;
}

/**
 * Response DTO for cancelling a policy
 */
export class CancelPolicyResponseDto {
  @ApiProperty({
    description: 'The cancelled policy',
    type: () => PolicyDto,
  })
  policy: PolicyDto;

  @ApiProperty({
    description: 'Cancellation message',
    example: 'Policy cancelled successfully',
  })
  message: string;
}
