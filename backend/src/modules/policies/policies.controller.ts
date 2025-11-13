import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { BindPolicyDto } from './dto/bind-policy.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  /**
   * Bind a quote to create a policy
   */
  @Post('bind')
  async bindPolicy(@Body() bindPolicyDto: BindPolicyDto) {
    return this.policiesService.bindPolicy(bindPolicyDto);
  }

  /**
   * Get all policies for authenticated user
   */
  @Get()
  async getUserPolicies(@Request() req) {
    const userId = req.user.userId;
    return this.policiesService.getUserPolicies(userId);
  }

  /**
   * Get active policies for authenticated user
   */
  @Get('active')
  async getActivePolicies(@Request() req) {
    const userId = req.user.userId;
    return this.policiesService.getActivePolicies(userId);
  }

  /**
   * Get policies expiring soon
   */
  @Get('expiring-soon')
  async getPoliciesExpiringSoon(@Request() req) {
    const userId = req.user.userId;
    return this.policiesService.getPoliciesExpiringSoon(userId);
  }

  /**
   * Get a specific policy
   */
  @Get(':id')
  async getPolicy(@Param('id') id: string) {
    return this.policiesService.getPolicyById(id);
  }

  /**
   * Get policy by policy number
   */
  @Get('number/:policyNumber')
  async getPolicyByNumber(@Param('policyNumber') policyNumber: string) {
    return this.policiesService.getPolicyByNumber(policyNumber);
  }

  /**
   * Cancel a policy
   */
  @Delete(':id')
  async cancelPolicy(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.policiesService.cancelPolicy(id, reason);
  }
}
