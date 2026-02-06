import { CarrierHealthStatus, CoverageType } from '@/common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO representing a carrier
 */
export class CarrierDto {
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

  @ApiProperty({
    description: 'Whether the carrier is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the carrier supports personal insurance',
    example: true,
  })
  supportsPersonal: boolean;

  @ApiProperty({
    description: 'Whether the carrier supports commercial insurance',
    example: true,
  })
  supportsCommercial: boolean;

  @ApiPropertyOptional({
    description: 'List of supported coverage types',
    example: [
      CoverageType.GENERAL_LIABILITY,
      CoverageType.PROFESSIONAL_LIABILITY,
      CoverageType.WORKERS_COMPENSATION,
    ],
    enum: CoverageType,
    enumName: 'CoverageType',
    isArray: true,
  })
  supportedCoverages?: CoverageType[];

  @ApiPropertyOptional({
    description: 'Last health check timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastHealthCheck?: Date;

  @ApiPropertyOptional({
    description: 'Current health status',
    enum: CarrierHealthStatus,
    enumName: 'CarrierHealthStatus',
    example: CarrierHealthStatus.OPERATIONAL,
  })
  healthStatus?: CarrierHealthStatus;

  @ApiProperty({
    description: 'When the carrier was created',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the carrier was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * Response DTO for carrier health check
 */
export class CarrierHealthResponseDto {
  @ApiProperty({
    description: 'Health check message',
    example: 'Health check completed',
  })
  message: string;
}
