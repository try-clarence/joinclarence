import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { Policy } from './entities/policy.entity';
import { CarriersModule } from '../carriers/carriers.module';
import { CarrierQuote } from '../carriers/entities/carrier-quote.entity';
import { QuoteRequest } from '../quotes/entities/quote-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Policy, CarrierQuote, QuoteRequest]),
    CarriersModule,
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
