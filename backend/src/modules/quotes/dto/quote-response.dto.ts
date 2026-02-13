import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  AddressType,
  CarrierQuoteStatus,
  CoverageType,
  InsuranceOptionStatus,
  InsuranceType,
  QuoteRequestStatus,
  RequestType,
} from '@/common/enums';
import { CoverageLimitsDto } from '@/common/types';

/**
 * DTO representing a quote request coverage
 */
export class QuoteRequestCoverageDto {
  @ApiProperty({
    description: 'Coverage ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Quote request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  quoteRequestId: string;

  @ApiProperty({
    description: 'Coverage type',
    enum: CoverageType,
    enumName: 'CoverageType',
    example: CoverageType.GENERAL_LIABILITY,
  })
  coverageType: CoverageType;

  @ApiProperty({
    description: 'Whether the coverage is selected',
    example: true,
  })
  isSelected: boolean;

  @ApiProperty({
    description: 'Whether the coverage is recommended',
    example: false,
  })
  isRecommended: boolean;

  @ApiPropertyOptional({
    description: 'Reason for recommendation',
    example: 'Recommended based on industry best practices',
  })
  recommendationReason?: string;

  @ApiProperty({
    description: 'When the coverage was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

/**
 * DTO representing a carrier in a quote
 */
export class CarrierInQuoteDto {
  @ApiProperty({
    description: 'Carrier ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Carrier code',
    example: 'ACME',
  })
  carrierCode: string;

  @ApiProperty({
    description: 'Carrier name',
    example: 'Acme Insurance',
  })
  carrierName: string;

  @ApiPropertyOptional({
    description: 'Carrier specialization',
    example: 'Small Business',
  })
  specialization?: string;
}

/**
 * DTO representing a carrier quote
 */
export class CarrierQuoteDto {
  @ApiProperty({
    description: 'Carrier quote ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Quote request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  quoteRequestId: string;

  @ApiProperty({
    description: 'Carrier ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  carrierId: string;

  @ApiPropertyOptional({
    description: 'Carrier details',
    type: () => CarrierInQuoteDto,
  })
  carrier?: CarrierInQuoteDto;

  @ApiProperty({
    description: 'External carrier quote ID',
    example: 'CQ-2024-001',
  })
  carrierQuoteId: string;

  @ApiProperty({
    description: 'Quote status',
    enum: CarrierQuoteStatus,
    enumName: 'CarrierQuoteStatus',
    example: CarrierQuoteStatus.QUOTED,
  })
  status: CarrierQuoteStatus;

  @ApiProperty({
    description: 'Coverage type',
    enum: CoverageType,
    enumName: 'CoverageType',
    example: CoverageType.GENERAL_LIABILITY,
  })
  coverageType: CoverageType;

  @ApiPropertyOptional({
    description: 'Insurance type',
    enum: InsuranceType,
    enumName: 'InsuranceType',
    example: InsuranceType.COMMERCIAL,
  })
  insuranceType?: InsuranceType;

  @ApiPropertyOptional({
    description: 'Annual premium amount',
    example: 5000,
  })
  annualPremium?: number;

  @ApiPropertyOptional({
    description: 'Monthly premium amount',
    example: 450,
  })
  monthlyPremium?: number;

  @ApiPropertyOptional({
    description: 'Quarterly premium amount',
    example: 1300,
  })
  quarterlyPremium?: number;

  @ApiPropertyOptional({
    description: 'Coverage limits',
    type: () => CoverageLimitsDto,
    example: { perOccurrence: 1000000, aggregate: 2000000 },
  })
  coverageLimits?: CoverageLimitsDto;

  @ApiPropertyOptional({
    description: 'Deductible amount',
    example: 1000,
  })
  deductible?: number;

  @ApiPropertyOptional({
    description: 'Effective date',
    example: '2024-02-01',
  })
  effectiveDate?: Date;

  @ApiPropertyOptional({
    description: 'Expiration date',
    example: '2025-02-01',
  })
  expirationDate?: Date;

  @ApiPropertyOptional({
    description: 'Policy form',
    example: 'CG 00 01',
  })
  policyForm?: string;

  @ApiPropertyOptional({
    description: 'Coverage highlights',
    example: ['24/7 Claims Support', 'Online Policy Management'],
    type: [String],
  })
  highlights?: string[];

  @ApiPropertyOptional({
    description: 'Coverage exclusions',
    example: ['War and terrorism', 'Nuclear hazard'],
    type: [String],
  })
  exclusions?: string[];

  @ApiPropertyOptional({
    description: 'Decline reason if quote was declined',
    example: 'High risk industry',
  })
  declineReason?: string;

  @ApiProperty({
    description: 'Quote valid until',
    example: '2024-03-01T00:00:00Z',
  })
  validUntil: Date;

  @ApiProperty({
    description: 'When the quote was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

/**
 * DTO representing a quote request
 */
export class QuoteRequestDto {
  @ApiProperty({
    description: 'Quote request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string;

  @ApiProperty({
    description: 'Insurance type',
    enum: InsuranceType,
    enumName: 'InsuranceType',
    example: InsuranceType.COMMERCIAL,
  })
  insuranceType: InsuranceType;

  @ApiProperty({
    description: 'Request type',
    enum: RequestType,
    enumName: 'RequestType',
    example: RequestType.NEW_BUSINESS,
  })
  requestType: RequestType;

  @ApiProperty({
    description: 'Quote request status',
    enum: QuoteRequestStatus,
    enumName: 'QuoteRequestStatus',
    example: QuoteRequestStatus.QUOTES_READY,
  })
  status: QuoteRequestStatus;

  // Business Information
  @ApiPropertyOptional({
    description: 'Legal business name',
    example: 'Acme Corporation',
  })
  legalBusinessName?: string;

  @ApiPropertyOptional({
    description: 'DBA name',
    example: 'Acme Inc',
  })
  dbaName?: string;

  @ApiPropertyOptional({
    description: 'Legal structure',
    example: 'LLC',
  })
  legalStructure?: string;

  @ApiPropertyOptional({
    description: 'Business website',
    example: 'https://www.acme.com',
  })
  businessWebsite?: string;

  @ApiPropertyOptional({
    description: 'Industry',
    example: 'Technology',
  })
  industry?: string;

  @ApiPropertyOptional({
    description: 'Industry code',
    example: '541511',
  })
  industryCode?: string;

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'Software development company',
  })
  businessDescription?: string;

  @ApiPropertyOptional({
    description: 'FEIN',
    example: '12-3456789',
  })
  fein?: string;

  @ApiPropertyOptional({
    description: 'Year started',
    example: 2020,
  })
  yearStarted?: number;

  @ApiPropertyOptional({
    description: 'Years under current ownership',
    example: 5,
  })
  yearsCurrentOwnership?: number;

  // Address
  @ApiPropertyOptional({
    description: 'Address type',
    enum: AddressType,
    enumName: 'AddressType',
    example: AddressType.PHYSICAL,
  })
  addressType?: AddressType;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main St',
  })
  streetAddress?: string;

  @ApiPropertyOptional({
    description: 'Address unit',
    example: 'Suite 100',
  })
  addressUnit?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'San Francisco',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'CA',
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'ZIP code',
    example: '94105',
  })
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Has subsidiaries',
    example: false,
  })
  hasSubsidiaries?: boolean;

  @ApiPropertyOptional({
    description: 'Has foreign subsidiaries',
    example: false,
  })
  hasForeignSubsidiaries?: boolean;

  @ApiPropertyOptional({
    description: 'Multiple entities',
    example: false,
  })
  multipleEntities?: boolean;

  // Contact Information
  @ApiPropertyOptional({
    description: 'Contact first name',
    example: 'John',
  })
  contactFirstName?: string;

  @ApiPropertyOptional({
    description: 'Contact last name',
    example: 'Doe',
  })
  contactLastName?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'john.doe@example.com',
  })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Contact phone',
    example: '+15551234567',
  })
  contactPhone?: string;

  // Financial Information
  @ApiPropertyOptional({
    description: 'Revenue 2024',
    example: 1000000,
  })
  revenue2024?: number;

  @ApiPropertyOptional({
    description: 'Expenses 2024',
    example: 800000,
  })
  expenses2024?: number;

  @ApiPropertyOptional({
    description: 'Revenue 2025 estimate',
    example: 1200000,
  })
  revenue2025Estimate?: number;

  @ApiPropertyOptional({
    description: 'Expenses 2025 estimate',
    example: 900000,
  })
  expenses2025Estimate?: number;

  @ApiPropertyOptional({
    description: 'Full-time employees',
    example: 10,
  })
  fullTimeEmployees?: number;

  @ApiPropertyOptional({
    description: 'Part-time employees',
    example: 5,
  })
  partTimeEmployees?: number;

  @ApiPropertyOptional({
    description: 'Total payroll',
    example: 500000,
  })
  totalPayroll?: number;

  @ApiPropertyOptional({
    description: 'Contractor percentage',
    example: 10,
  })
  contractorPercentage?: number;

  // Additional
  @ApiPropertyOptional({
    description: 'Additional comments',
    example: 'Looking for coverage starting next month',
  })
  additionalComments?: string;

  @ApiPropertyOptional({
    description: 'Consent to marketing',
    example: true,
  })
  consentMarketing?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to privacy policy',
    example: true,
  })
  consentPrivacyPolicy?: boolean;

  @ApiPropertyOptional({
    description: 'Uploaded document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uploadedDocumentId?: string;

  // Timestamps
  @ApiPropertyOptional({
    description: 'When the quote was submitted',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: 'When quotes were ready',
    example: '2024-01-15T10:35:00Z',
  })
  quotesReadyAt?: Date;

  @ApiPropertyOptional({
    description: 'Estimated completion time',
    example: '2024-01-15T10:35:00Z',
  })
  estimatedCompletionTime?: Date;

  @ApiProperty({
    description: 'When the quote request was created',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the quote request was last updated',
    example: '2024-01-15T10:35:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Selected coverages for this quote request',
    type: () => [QuoteRequestCoverageDto],
  })
  coverages?: QuoteRequestCoverageDto[];
}

/**
 * Response DTO for getting a quote request with quotes
 */
export class GetQuoteDetailResponseDto {
  @ApiProperty({
    description: 'The quote request',
    type: () => QuoteRequestDto,
  })
  quoteRequest: QuoteRequestDto;

  @ApiProperty({
    description: 'Selected coverages',
    type: () => [QuoteRequestCoverageDto],
  })
  coverages: QuoteRequestCoverageDto[];

  @ApiProperty({
    description: 'Insurance options (transformed carrier quotes)',
    type: () => [InsuranceOptionDto],
  })
  options: InsuranceOptionDto[];

  @ApiProperty({
    description: 'Quote request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  quoteId: string;
}

/**
 * DTO for carrier rating
 */
export class CarrierRatingDto {
  @ApiProperty({
    description: 'Rating agency',
    example: 'A.M. Best',
  })
  agency: string;

  @ApiProperty({
    description: 'Rating value',
    example: 'A+',
  })
  rating: string;

  @ApiProperty({
    description: 'Rating outlook',
    example: 'Stable',
  })
  outlook: string;
}

/**
 * DTO for available add-on
 */
export class AvailableAddonDto {
  @ApiProperty({
    description: 'Add-on name',
    example: 'Cyber Liability',
  })
  name: string;

  @ApiProperty({
    description: 'Add-on description',
    example: 'Protects against data breaches and cyber attacks',
  })
  description: string;

  @ApiProperty({
    description: 'Additional cost',
    example: 500,
  })
  additionalCost: number;
}

/**
 * DTO representing a single insurance option
 */
export class InsuranceOptionDto {
  @ApiProperty({
    description: 'Option ID (same as carrier quote ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Quote request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  quoteId: string;

  @ApiProperty({
    description: 'Carrier name',
    example: 'Acme Insurance',
  })
  carrier: string;

  @ApiPropertyOptional({
    description: 'Carrier logo URL',
    example: 'https://example.com/logo.png',
  })
  carrierLogo?: string;

  @ApiProperty({
    description: 'Carrier rating',
    type: () => CarrierRatingDto,
  })
  carrierRating: CarrierRatingDto;

  @ApiProperty({
    description: 'Annual premium',
    example: 5000,
  })
  annualPremium: number;

  @ApiProperty({
    description: 'Monthly premium',
    example: 450,
  })
  monthlyPremium: number;

  @ApiProperty({
    description: 'Quarterly premium',
    example: 1300,
  })
  quarterlyPremium: number;

  @ApiProperty({
    description: 'Coverage type',
    enum: CoverageType,
    enumName: 'CoverageType',
    example: CoverageType.GENERAL_LIABILITY,
  })
  coverageType: CoverageType;

  @ApiProperty({
    description: 'Coverage limits',
    type: () => CoverageLimitsDto,
    example: { perOccurrence: 1000000, aggregate: 2000000 },
  })
  coverageLimits: CoverageLimitsDto;

  @ApiProperty({
    description: 'Coverage highlights',
    example: ['General Liability: $1M / $2M', 'Deductible: $1,000'],
    type: [String],
  })
  coverageHighlights: string[];

  @ApiProperty({
    description: 'Deductible amount',
    example: 1000,
  })
  deductible: number;

  @ApiProperty({
    description: 'Features included',
    example: ['24/7 Claims Support', 'Online Policy Management'],
    type: [String],
  })
  features: string[];

  @ApiPropertyOptional({
    description: 'Additional benefits',
    example: ['Free risk assessment', 'Annual policy review'],
    type: [String],
  })
  additionalBenefits?: string[];

  @ApiProperty({
    description: 'Option status',
    enum: InsuranceOptionStatus,
    enumName: 'InsuranceOptionStatus',
    example: InsuranceOptionStatus.AVAILABLE,
  })
  status: InsuranceOptionStatus;

  @ApiProperty({
    description: 'Quote available until',
    example: '2024-03-01T00:00:00Z',
  })
  availableUntil: string;

  @ApiProperty({
    description: 'Available add-ons',
    type: () => [AvailableAddonDto],
  })
  availableAddons: AvailableAddonDto[];

  @ApiProperty({
    description: 'Whether this option is recommended',
    example: true,
  })
  recommended: boolean;

  @ApiProperty({
    description: 'Whether this is a popular choice',
    example: true,
  })
  popularChoice: boolean;

  @ApiProperty({
    description: 'Whether this is the best value',
    example: false,
  })
  bestValue: boolean;

  @ApiProperty({
    description: 'When the option was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'When the option was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: string;
}

/**
 * Response DTO for getting insurance options
 */
export class GetInsuranceOptionsResponseDto {
  @ApiProperty({
    description: 'List of insurance options',
    type: () => [InsuranceOptionDto],
  })
  options: InsuranceOptionDto[];

  @ApiProperty({
    description: 'Quote request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  quoteId: string;
}
