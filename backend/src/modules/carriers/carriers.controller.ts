import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CarriersService } from './carriers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get()
  async getActiveCarriers() {
    return this.carriersService.findActiveCarriers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/health')
  async checkHealth(@Param('id') id: string) {
    await this.carriersService.checkCarrierHealth(id);
    return { message: 'Health check completed' };
  }
}
