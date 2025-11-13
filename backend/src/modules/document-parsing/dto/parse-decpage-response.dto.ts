import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetadataDto {
  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  parsedAt: string;

  @ApiProperty({ description: 'Confidence score between 0 and 1' })
  confidence: number;

  @ApiPropertyOptional()
  fileUrl?: string;
}

export class ParseDecPageResponseDto {
  @ApiPropertyOptional()
  legalBusinessName?: string;

  @ApiPropertyOptional()
  doingBusinessAs?: string;

  @ApiPropertyOptional({
    enum: ['llc', 'corporation', 'partnership', 'sole-proprietorship'],
  })
  legalStructure?: string;

  @ApiPropertyOptional()
  businessWebsite?: string;

  @ApiPropertyOptional()
  primaryIndustry?: string;

  @ApiPropertyOptional()
  businessDescription?: string;

  @ApiPropertyOptional()
  businessFen?: string;

  @ApiPropertyOptional()
  yearBusinessStarted?: string;

  @ApiPropertyOptional()
  yearsUnderCurrentOwnership?: string;

  @ApiPropertyOptional({ type: [String] })
  addressType?: string[];

  @ApiPropertyOptional()
  businessAddress?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  zip?: number;

  @ApiPropertyOptional({ enum: ['yes', 'no'] })
  hasSubsidiaries?: string;

  @ApiPropertyOptional({ enum: ['yes', 'no'] })
  hasForeignSubsidiaries?: string;

  @ApiPropertyOptional({ enum: ['yes', 'no'] })
  seekingMultipleEntities?: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  lastYearRevenue?: number;

  @ApiPropertyOptional()
  estimatedCurrentYearRevenue?: number;

  @ApiPropertyOptional()
  lastYearExpenses?: number;

  @ApiPropertyOptional()
  estimatedCurrentYearExpenses?: number;

  @ApiPropertyOptional()
  numberOfEmployees?: number;

  @ApiPropertyOptional()
  numberOfPartTimeEmployees?: number;

  @ApiPropertyOptional()
  estimatedTotalPayroll?: number;

  @ApiPropertyOptional()
  independentContractorsPayrollPercent?: number;

  @ApiProperty()
  metadata: MetadataDto;
}
