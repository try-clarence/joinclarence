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
import { Policy } from '../../policies/entities/policy.entity';
import { PaymentType, PaymentStatus, PaymentMethod } from '@/common/enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'policy_id', type: 'uuid' })
  policyId: string;

  @ManyToOne(() => Policy)
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'stripe_payment_intent_id', length: 100, nullable: true })
  stripePaymentIntentId: string;

  @Column({ name: 'stripe_charge_id', length: 100, nullable: true })
  stripeChargeId: string;

  @Column({ name: 'payment_method_last4', length: 4, nullable: true })
  paymentMethodLast4: string;

  @Column({ name: 'carrier_payment_id', length: 100, nullable: true })
  carrierPaymentId: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ name: 'receipt_url', length: 500, nullable: true })
  receiptUrl: string;

  @Column({ name: 'failure_code', length: 50, nullable: true })
  failureCode: string;

  @Column({ name: 'failure_message', type: 'text', nullable: true })
  failureMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
