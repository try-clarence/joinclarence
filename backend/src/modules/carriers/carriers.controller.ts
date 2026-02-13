import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CarriersService } from './carriers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CarrierDto,
  CarrierHealthResponseDto,
} from './dto/carrier-response.dto';

@ApiTags('Carriers')
@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active carriers' })
  @ApiResponse({
    status: 200,
    description: 'List of active carriers',
    type: [CarrierDto],
  })
  async getActiveCarriers(): Promise<CarrierDto[]> {
    return this.carriersService.findActiveCarriers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/health')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check carrier health status' })
  @ApiParam({ name: 'id', description: 'Carrier ID' })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    type: CarrierHealthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Carrier not found',
  })
  async checkHealth(
    @Param('id') id: string,
  ): Promise<CarrierHealthResponseDto> {
    await this.carriersService.checkCarrierHealth(id);
    return { message: 'Health check completed' };
  }
}
