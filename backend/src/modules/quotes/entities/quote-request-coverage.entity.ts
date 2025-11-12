import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuoteRequest } from './quote-request.entity';

@Entity('quote_request_coverages')
export class QuoteRequestCoverage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quote_request_id', type: 'uuid' })
  quoteRequestId: string;

  @ManyToOne(() => QuoteRequest)
  @JoinColumn({ name: 'quote_request_id' })
  quoteRequest: QuoteRequest;

  @Column({ name: 'coverage_type', length: 50 })
  coverageType: string;

  @Column({ name: 'is_selected', default: false })
  isSelected: boolean;

  @Column({ name: 'is_recommended', default: false })
  isRecommended: boolean;

  @Column({ name: 'recommendation_reason', type: 'text', nullable: true })
  recommendationReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
