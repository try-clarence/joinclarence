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
import { QuoteRequest } from '../../quotes/entities/quote-request.entity';
import { CarrierQuote } from '../../carriers/entities/carrier-quote.entity';
import { Carrier } from '../../carriers/entities/carrier.entity';

export enum PolicyStatus {
  BOUND = 'bound',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING_CANCELLATION = 'pending_cancellation',
}

export enum PaymentPlan {
  ANNUAL = 'annual',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'quote_request_id', type: 'uuid' })
  quoteRequestId: string;

  @ManyToOne(() => QuoteRequest)
  @JoinColumn({ name: 'quote_request_id' })
  quoteRequest: QuoteRequest;

  @Column({ name: 'carrier_quote_id', type: 'uuid' })
  carrierQuoteId: string;

  @ManyToOne(() => CarrierQuote)
  @JoinColumn({ name: 'carrier_quote_id' })
  carrierQuote: CarrierQuote;

  @Column({ name: 'carrier_id', type: 'uuid' })
  carrierId: string;

  @ManyToOne(() => Carrier)
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  // Policy Identifiers
  @Column({ name: 'policy_number', length: 100, unique: true })
  policyNumber: string;

  @Column({ name: 'carrier_policy_id', length: 100 })
  carrierPolicyId: string;

  @Column({ name: 'carrier_bind_id', length: 100, nullable: true })
  carrierBindId: string;

  // Policy Details
  @Column({ name: 'insurance_type', length: 20 })
  insuranceType: string;

  @Column({ name: 'coverage_type', length: 50 })
  coverageType: string;

  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.BOUND,
  })
  status: PolicyStatus;

  // Coverage & Premium
  @Column({ name: 'coverage_limits', type: 'jsonb' })
  coverageLimits: any;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  deductible: number;

  @Column({ name: 'annual_premium', type: 'decimal', precision: 15, scale: 2 })
  annualPremium: number;

  @Column({
    name: 'payment_plan',
    type: 'enum',
    enum: PaymentPlan,
  })
  paymentPlan: PaymentPlan;

  @Column({ name: 'monthly_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  monthlyAmount: number;

  // Dates
  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  @Column({ name: 'expiration_date', type: 'date' })
  expirationDate: Date;

  @Column({ name: 'bound_at', type: 'timestamp' })
  boundAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // Insured Information
  @Column({ name: 'insured_name', length: 255 })
  insuredName: string;

  @Column({ name: 'insured_address', type: 'text' })
  insuredAddress: string;

  // Payment Information
  @Column({ name: 'first_payment_due', type: 'date', nullable: true })
  firstPaymentDue: Date;

  @Column({ name: 'next_payment_date', type: 'date', nullable: true })
  nextPaymentDate: Date;

  @Column({ name: 'payments_remaining', type: 'int', nullable: true })
  paymentsRemaining: number;

  @Column({ name: 'auto_renewal', default: true })
  autoRenewal: boolean;

  // Policy Documents
  @Column({ name: 'policy_document_url', length: 500, nullable: true })
  policyDocumentUrl: string;

  @Column({ name: 'declarations_url', length: 500, nullable: true })
  declarationsUrl: string;

  @Column({ name: 'certificate_url', length: 500, nullable: true })
  certificateUrl: string;

  // Carrier Contact
  @Column({ name: 'carrier_contact_info', type: 'jsonb', nullable: true })
  carrierContactInfo: any;

  // Full carrier response
  @Column({ name: 'carrier_policy_data', type: 'jsonb', nullable: true })
  carrierPolicyData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
