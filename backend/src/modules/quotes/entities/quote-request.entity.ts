import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum QuoteRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  QUOTES_READY = 'quotes_ready',
  QUOTE_SELECTED = 'quote_selected',
  PURCHASED = 'purchased',
  EXPIRED = 'expired',
}

export enum InsuranceType {
  PERSONAL = 'personal',
  COMMERCIAL = 'commercial',
}

export enum RequestType {
  NEW_COVERAGE = 'new_coverage',
  RENEWAL = 'renewal',
}

export enum AddressType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
}

@Entity('quote_requests')
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'session_id', length: 100 })
  sessionId: string;

  @Column({
    name: 'insurance_type',
    type: 'enum',
    enum: InsuranceType,
  })
  insuranceType: InsuranceType;

  @Column({
    name: 'request_type',
    type: 'enum',
    enum: RequestType,
  })
  requestType: RequestType;

  @Column({
    type: 'enum',
    enum: QuoteRequestStatus,
    default: QuoteRequestStatus.DRAFT,
  })
  status: QuoteRequestStatus;

  // Step 2: Business/Personal Information
  @Column({ name: 'legal_business_name', length: 255, nullable: true })
  legalBusinessName: string;

  @Column({ name: 'dba_name', length: 255, nullable: true })
  dbaName: string;

  @Column({ name: 'legal_structure', length: 50, nullable: true })
  legalStructure: string;

  @Column({ name: 'business_website', length: 255, nullable: true })
  businessWebsite: string;

  @Column({ length: 255, nullable: true })
  industry: string;

  @Column({ name: 'industry_code', length: 20, nullable: true })
  industryCode: string;

  @Column({ name: 'business_description', type: 'text', nullable: true })
  businessDescription: string;

  @Column({ length: 20, nullable: true })
  fein: string;

  @Column({ name: 'year_started', type: 'int', nullable: true })
  yearStarted: number;

  @Column({ name: 'years_current_ownership', type: 'int', nullable: true })
  yearsCurrentOwnership: number;

  @Column({
    name: 'address_type',
    type: 'enum',
    enum: AddressType,
    nullable: true,
  })
  addressType: AddressType;

  // Address
  @Column({ name: 'street_address', length: 255, nullable: true })
  streetAddress: string;

  @Column({ name: 'address_unit', length: 50, nullable: true })
  addressUnit: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 2, nullable: true })
  state: string;

  @Column({ name: 'zip_code', length: 10, nullable: true })
  zipCode: string;

  // Additional Business Details
  @Column({ name: 'has_subsidiaries', nullable: true })
  hasSubsidiaries: boolean;

  @Column({ name: 'has_foreign_subsidiaries', nullable: true })
  hasForeignSubsidiaries: boolean;

  @Column({ name: 'multiple_entities', nullable: true })
  multipleEntities: boolean;

  // Contact Information
  @Column({ name: 'contact_first_name', length: 100, nullable: true })
  contactFirstName: string;

  @Column({ name: 'contact_last_name', length: 100, nullable: true })
  contactLastName: string;

  @Column({ name: 'contact_email', length: 255, nullable: true })
  contactEmail: string;

  @Column({ name: 'contact_phone', length: 15, nullable: true })
  contactPhone: string;

  // Step 3: Financial Information
  @Column({
    name: 'revenue_2024',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  revenue2024: number;

  @Column({
    name: 'expenses_2024',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  expenses2024: number;

  @Column({
    name: 'revenue_2025_estimate',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  revenue2025Estimate: number;

  @Column({
    name: 'expenses_2025_estimate',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  expenses2025Estimate: number;

  @Column({ name: 'full_time_employees', type: 'int', nullable: true })
  fullTimeEmployees: number;

  @Column({ name: 'part_time_employees', type: 'int', nullable: true })
  partTimeEmployees: number;

  @Column({
    name: 'total_payroll',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalPayroll: number;

  @Column({
    name: 'contractor_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  contractorPercentage: number;

  // Step 5: Final Details
  @Column({ name: 'additional_comments', type: 'text', nullable: true })
  additionalComments: string;

  @Column({ name: 'consent_marketing', default: false })
  consentMarketing: boolean;

  @Column({ name: 'consent_privacy_policy', default: false })
  consentPrivacyPolicy: boolean;

  // Document Upload
  @Column({ name: 'uploaded_document_id', type: 'uuid', nullable: true })
  uploadedDocumentId: string;

  // Metadata
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'quotes_ready_at', type: 'timestamp', nullable: true })
  quotesReadyAt: Date;

  @Column({
    name: 'estimated_completion_time',
    type: 'timestamp',
    nullable: true,
  })
  estimatedCompletionTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
