import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Carrier } from './carrier.entity';
import { QuoteRequest } from '../../quotes/entities/quote-request.entity';

export enum CarrierQuoteStatus {
  QUOTED = 'quoted',
  DECLINED = 'declined',
  REFERRED = 'referred',
  EXPIRED = 'expired',
}

@Entity('carrier_quotes')
export class CarrierQuote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quote_request_id', type: 'uuid' })
  quoteRequestId: string;

  @ManyToOne(() => QuoteRequest)
  @JoinColumn({ name: 'quote_request_id' })
  quoteRequest: QuoteRequest;

  @Column({ name: 'carrier_id', type: 'uuid' })
  carrierId: string;

  @ManyToOne(() => Carrier)
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  // Carrier Response
  @Column({ name: 'carrier_quote_id', length: 100 })
  carrierQuoteId: string;

  @Column({ name: 'carrier_response', type: 'jsonb' })
  carrierResponse: any;

  // Quote Summary
  @Column({
    type: 'enum',
    enum: CarrierQuoteStatus,
  })
  status: CarrierQuoteStatus;

  @Column({ name: 'coverage_type', length: 50 })
  coverageType: string;

  @Column({ name: 'insurance_type', length: 20, nullable: true })
  insuranceType: string;

  // Premium
  @Column({
    name: 'annual_premium',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  annualPremium: number;

  @Column({
    name: 'monthly_premium',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  monthlyPremium: number;

  @Column({
    name: 'quarterly_premium',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  quarterlyPremium: number;

  @Column({
    name: 'payment_in_full_discount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  paymentInFullDiscount: number;

  // Coverage Details
  @Column({ name: 'coverage_limits', type: 'jsonb', nullable: true })
  coverageLimits: any;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  deductible: number;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date;

  // Quote Details
  @Column({ name: 'policy_form', length: 100, nullable: true })
  policyForm: string;

  @Column({ type: 'jsonb', nullable: true })
  highlights: string[];

  @Column({ type: 'jsonb', nullable: true })
  exclusions: string[];

  @Column({ name: 'optional_coverages', type: 'jsonb', nullable: true })
  optionalCoverages: any[];

  @Column({ name: 'underwriting_notes', type: 'jsonb', nullable: true })
  underwritingNotes: string[];

  // Decline Information
  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason: string;

  @Column({ name: 'decline_code', length: 50, nullable: true })
  declineCode: string;

  // Package Discount
  @Column({
    name: 'package_discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  packageDiscountPercentage: number;

  @Column({
    name: 'package_discount_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  packageDiscountAmount: number;

  // Validity
  @Column({ name: 'valid_until', type: 'timestamp' })
  validUntil: Date;

  // Metadata
  @Column({ name: 'generated_via_llm', default: false })
  generatedViaLlm: boolean;

  @Column({ default: false })
  cached: boolean;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true })
  responseTimeMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
