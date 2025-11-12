import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InsuranceType {
  COMMERCIAL = 'commercial',
  PERSONAL = 'personal',
}

export enum RequestType {
  NEW_BUSINESS = 'new_business',
  RENEWAL = 'renewal',
  QUOTE_ONLY = 'quote_only',
}

export class CreateQuoteRequestDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  sessionId: string;

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
  @IsArray()
  @IsString({ each: true })
  selectedCoverages: string[];
}

export class SubmitQuoteRequestDto {
  @IsUUID()
  quoteRequestId: string;
}
