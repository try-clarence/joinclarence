import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { QuoteRequest } from './entities/quote-request.entity';
import { QuoteRequestCoverage } from './entities/quote-request-coverage.entity';
import { CarriersModule } from '../carriers/carriers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteRequest, QuoteRequestCoverage]),
    CarriersModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
