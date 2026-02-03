import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CarriersService } from './carriers.service';
import { CarriersController } from './carriers.controller';
import { Carrier } from './entities/carrier.entity';
import { CarrierQuote } from './entities/carrier-quote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carrier, CarrierQuote]),
    HttpModule.register({
      timeout: parseInt(process.env.CARRIER_API_TIMEOUT) || 10000,
    }),
  ],
  controllers: [CarriersController],
  providers: [CarriersService],
  exports: [CarriersService],
})
export class CarriersModule {}
