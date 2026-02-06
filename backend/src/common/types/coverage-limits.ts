import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO representing coverage limits for a policy or quote
 */
export class CoverageLimitsDto {
  @ApiPropertyOptional({
    description: 'Per occurrence limit',
    example: 1000000,
  })
  perOccurrence?: number;

  @ApiPropertyOptional({
    description: 'General aggregate limit',
    example: 2000000,
  })
  aggregate?: number;

  @ApiPropertyOptional({
    description: 'Products/completed operations aggregate',
    example: 2000000,
  })
  productCompletedOps?: number;

  @ApiPropertyOptional({
    description: 'Property damage limit',
    example: 100000,
  })
  propertyDamageLimit?: number;

  @ApiPropertyOptional({
    description: 'Property damage deductible',
    example: 1000,
  })
  propertyDamageDeductible?: number;

  @ApiPropertyOptional({
    description: 'Personal and advertising injury limit',
    example: 1000000,
  })
  personalAdvertisingInjury?: number;

  @ApiPropertyOptional({
    description: 'Medical expense limit',
    example: 10000,
  })
  medicalExpense?: number;

  @ApiPropertyOptional({
    description: 'Fire damage limit (legal liability)',
    example: 100000,
  })
  fireDamage?: number;
}

/**
 * DTO representing an optional coverage add-on
 */
export class OptionalCoverageDto {
  @ApiProperty({
    description: 'Name of the optional coverage',
    example: 'Cyber Liability',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the optional coverage',
    example: 'Protects against data breaches and cyber attacks',
  })
  description: string;

  @ApiProperty({
    description: 'Additional cost for this coverage',
    example: 500,
  })
  additionalCost: number;

  @ApiProperty({
    description: 'Whether this coverage is included',
    example: false,
  })
  included: boolean;
}

/**
 * Type for coverage limits stored in JSONB columns
 * Allows for flexible key-value pairs while maintaining some structure
 */
export interface CoverageLimits {
  perOccurrence?: number;
  aggregate?: number;
  productCompletedOps?: number;
  propertyDamageLimit?: number;
  propertyDamageDeductible?: number;
  personalAdvertisingInjury?: number;
  medicalExpense?: number;
  fireDamage?: number;
  // Allow additional properties for carrier-specific limits
  [key: string]: number | undefined;
}

/**
 * Type for optional coverage stored in JSONB columns
 */
export interface OptionalCoverage {
  name: string;
  description: string;
  additionalCost: number;
  included: boolean;
}
