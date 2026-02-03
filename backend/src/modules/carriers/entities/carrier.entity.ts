import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CarrierHealthStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

@Entity('carriers')
export class Carrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'carrier_code', length: 50, unique: true })
  carrierCode: string;

  @Column({ name: 'carrier_name', length: 255 })
  carrierName: string;

  @Column({ length: 255, nullable: true })
  specialization: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'api_base_url', length: 500, nullable: true })
  apiBaseUrl: string;

  @Column({ name: 'api_key_encrypted', type: 'text', nullable: true })
  apiKeyEncrypted: string;

  @Column({ name: 'supports_personal', default: true })
  supportsPersonal: boolean;

  @Column({ name: 'supports_commercial', default: true })
  supportsCommercial: boolean;

  @Column({ name: 'supported_coverages', type: 'jsonb', nullable: true })
  supportedCoverages: string[];

  // Health check
  @Column({ name: 'last_health_check', type: 'timestamp', nullable: true })
  lastHealthCheck: Date;

  @Column({
    name: 'health_status',
    type: 'enum',
    enum: CarrierHealthStatus,
    nullable: true,
  })
  healthStatus: CarrierHealthStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
