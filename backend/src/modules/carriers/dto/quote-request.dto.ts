import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
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

export class BusinessInfoDto {
  @IsString()
  legalBusinessName: string;

  @IsOptional()
  @IsString()
  dbaName?: string;

  @IsString()
  legalStructure: string;

  @IsOptional()
  @IsString()
  businessWebsite?: string;

  @IsString()
  industry: string;

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
}

export class AddressDto {
  @IsString()
  addressType: string;

  @IsString()
  streetAddress: string;

  @IsOptional()
  @IsString()
  addressUnit?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;
}

export class FinancialInfoDto {
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
}

export class ContactInfoDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;
}

export class CarrierQuoteRequestDto {
  @IsEnum(InsuranceType)
  insuranceType: InsuranceType;

  @IsEnum(RequestType)
  requestType: RequestType;

  @ValidateNested()
  @Type(() => BusinessInfoDto)
  businessInfo: BusinessInfoDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested()
  @Type(() => FinancialInfoDto)
  financialInfo: FinancialInfoDto;

  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto;

  @IsArray()
  @IsString({ each: true })
  selectedCoverages: string[];

  @IsOptional()
  @IsString()
  additionalComments?: string;
}
