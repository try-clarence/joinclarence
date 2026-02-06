import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  IsEmail,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CoverageType, InsuranceType, RequestType } from '@/common/enums';

export class CreateQuoteRequestDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsEnum(InsuranceType)
  insuranceType: InsuranceType;

  @IsEnum(RequestType)
  requestType: RequestType;

  // Step 2: Business Information
  @IsOptional()
  @IsString()
  legalBusinessName?: string;

  @IsOptional()
  @IsString()
  dbaName?: string;

  @IsOptional()
  @IsString()
  legalStructure?: string;

  @IsOptional()
  @IsString()
  businessWebsite?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  industryCode?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  fein?: string;

  @IsOptional()
  @IsNumber()
  yearStarted?: number;

  @IsOptional()
  @IsNumber()
  yearsCurrentOwnership?: number;

  // Step 2: Business Address
  @IsOptional()
  @IsString()
  addressType?: string;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  addressUnit?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsBoolean()
  hasSubsidiaries?: boolean;

  @IsOptional()
  @IsBoolean()
  hasForeignSubsidiaries?: boolean;

  @IsOptional()
  @IsBoolean()
  multipleEntities?: boolean;

  // Step 3: Contact Information
  @IsOptional()
  @IsString()
  contactFirstName?: string;

  @IsOptional()
  @IsString()
  contactLastName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Array of coverage types',
    enum: CoverageType,
    enumName: 'CoverageType',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CoverageType, { each: true })
  coverageTypes?: CoverageType[];

  // Step 5: Financial Information
  @IsOptional()
  @IsNumber()
  revenue2024?: number;

  @IsOptional()
  @IsNumber()
  expenses2024?: number;

  @IsOptional()
  @IsNumber()
  revenue2025Estimate?: number;

  @IsOptional()
  @IsNumber()
  expenses2025Estimate?: number;

  @IsOptional()
  @IsNumber()
  fullTimeEmployees?: number;

  @IsOptional()
  @IsNumber()
  partTimeEmployees?: number;

  @IsOptional()
  @IsNumber()
  totalPayroll?: number;

  @IsOptional()
  @IsNumber()
  contractorPercentage?: number;

  // Additional
  @IsOptional()
  @IsString()
  additionalComments?: string;

  @IsOptional()
  @IsBoolean()
  consentMarketing?: boolean;

  @IsOptional()
  @IsBoolean()
  consentPrivacyPolicy?: boolean;

  @IsOptional()
  @IsUUID()
  uploadedDocumentId?: string;
}

export class SelectCoveragesDto {
  @ApiProperty({
    description: 'Array of coverage types to select for the quote',
    example: [
      CoverageType.GENERAL_LIABILITY,
      CoverageType.PROFESSIONAL_LIABILITY,
    ],
    enum: CoverageType,
    enumName: 'CoverageType',
    isArray: true,
  })
  @IsArray()
  @IsEnum(CoverageType, { each: true })
  selectedCoverages: CoverageType[];
}

export class SubmitQuoteRequestDto {
  @IsUUID()
  quoteRequestId: string;
}

/**
 * DTO for unified quote submission - creates quote, adds coverages, and submits in one call
 */
export class SubmitQuoteDto {
  @ApiPropertyOptional({
    description: 'User ID for the quote request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Type of insurance',
    enum: InsuranceType,
    enumName: 'InsuranceType',
    example: InsuranceType.COMMERCIAL,
  })
  @IsEnum(InsuranceType)
  insuranceType: InsuranceType;

  @ApiProperty({
    description: 'Type of quote request',
    enum: RequestType,
    enumName: 'RequestType',
    example: RequestType.NEW_BUSINESS,
  })
  @IsEnum(RequestType)
  requestType: RequestType;

  // Required Business Information
  @ApiProperty({
    description: 'Legal business name',
    example: 'Acme Corporation',
  })
  @IsString()
  legalBusinessName: string;

  @ApiProperty({
    description: 'Business industry',
    example: 'Technology',
  })
  @IsString()
  industry: string;

  // Required Address
  @ApiProperty({
    description: 'Street address',
    example: '123 Main St',
  })
  @IsString()
  streetAddress: string;

  @ApiProperty({
    description: 'City',
    example: 'San Francisco',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State (2-letter code)',
    example: 'CA',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'ZIP code',
    example: '94105',
  })
  @IsString()
  zipCode: string;

  // Required Contact Information
  @ApiProperty({
    description: 'Contact first name',
    example: 'John',
  })
  @IsString()
  contactFirstName: string;

  @ApiProperty({
    description: 'Contact last name',
    example: 'Doe',
  })
  @IsString()
  contactLastName: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+15551234567',
  })
  @IsString()
  contactPhone: string;

  // Required Coverages
  @ApiProperty({
    description: 'Array of selected coverage types',
    example: [
      CoverageType.GENERAL_LIABILITY,
      CoverageType.PROFESSIONAL_LIABILITY,
    ],
    enum: CoverageType,
    enumName: 'CoverageType',
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one coverage must be selected' })
  @IsEnum(CoverageType, { each: true })
  selectedCoverages: CoverageType[];

  // Optional Business Information
  @ApiPropertyOptional({
    description: 'DBA (Doing Business As) name',
    example: 'Acme Inc',
  })
  @IsOptional()
  @IsString()
  dbaName?: string;

  @ApiPropertyOptional({
    description: 'Legal structure of the business',
    example: 'LLC',
  })
  @IsOptional()
  @IsString()
  legalStructure?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://www.acme.com',
  })
  @IsOptional()
  @IsString()
  businessWebsite?: string;

  @ApiPropertyOptional({
    description: 'Industry code (NAICS)',
    example: '541511',
  })
  @IsOptional()
  @IsString()
  industryCode?: string;

  @ApiPropertyOptional({
    description: 'Description of the business',
    example: 'Software development company',
  })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiPropertyOptional({
    description: 'Federal Employer Identification Number',
    example: '12-3456789',
  })
  @IsOptional()
  @IsString()
  fein?: string;

  @ApiPropertyOptional({
    description: 'Year the business was started',
    example: 2020,
  })
  @IsOptional()
  @IsNumber()
  yearStarted?: number;

  @ApiPropertyOptional({
    description: 'Years under current ownership',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  yearsCurrentOwnership?: number;

  // Optional Address Fields
  @ApiPropertyOptional({
    description: 'Type of address (physical, virtual)',
    example: 'physical',
  })
  @IsOptional()
  @IsString()
  addressType?: string;

  @ApiPropertyOptional({
    description: 'Address unit/suite number',
    example: 'Suite 100',
  })
  @IsOptional()
  @IsString()
  addressUnit?: string;

  @ApiPropertyOptional({
    description: 'Whether the business has subsidiaries',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasSubsidiaries?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the business has foreign subsidiaries',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasForeignSubsidiaries?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the business has multiple entities',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  multipleEntities?: boolean;

  // Optional Financial Information
  @ApiPropertyOptional({
    description: 'Revenue for 2024',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  revenue2024?: number;

  @ApiPropertyOptional({
    description: 'Expenses for 2024',
    example: 800000,
  })
  @IsOptional()
  @IsNumber()
  expenses2024?: number;

  @ApiPropertyOptional({
    description: 'Estimated revenue for 2025',
    example: 1200000,
  })
  @IsOptional()
  @IsNumber()
  revenue2025Estimate?: number;

  @ApiPropertyOptional({
    description: 'Estimated expenses for 2025',
    example: 900000,
  })
  @IsOptional()
  @IsNumber()
  expenses2025Estimate?: number;

  @ApiPropertyOptional({
    description: 'Number of full-time employees',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  fullTimeEmployees?: number;

  @ApiPropertyOptional({
    description: 'Number of part-time employees',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  partTimeEmployees?: number;

  @ApiPropertyOptional({
    description: 'Total annual payroll',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  totalPayroll?: number;

  @ApiPropertyOptional({
    description: 'Percentage of work done by contractors',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  contractorPercentage?: number;

  // Additional
  @ApiPropertyOptional({
    description: 'Additional comments or notes',
    example: 'Looking for coverage starting next month',
  })
  @IsOptional()
  @IsString()
  additionalComments?: string;

  @ApiPropertyOptional({
    description: 'Consent to marketing communications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  consentMarketing?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to privacy policy',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  consentPrivacyPolicy?: boolean;

  @ApiPropertyOptional({
    description: 'ID of uploaded document',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  uploadedDocumentId?: string;
}
