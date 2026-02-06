import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BindPolicyDto } from './dto/bind-policy.dto';
import { RenewPolicyDto } from './dto/renew-policy.dto';
import { BindPolicyResponseDto, PolicyDto } from './dto/policy-response.dto';
import { PoliciesService } from './policies.service';
import { CurrentUser } from '@/common/decorators';
import { JwtPayload } from '@/common/interfaces';

@ApiTags('Policies')
@Controller('policies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  /**
   * Bind a quote to create a policy
   */
  @Post('bind')
  @ApiOperation({ summary: 'Bind a quote to create a policy' })
  @ApiResponse({
    status: 201,
    description: 'Policy created successfully',
    type: BindPolicyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Quote cannot be bound or has expired',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async bindPolicy(
    @Body() bindPolicyDto: BindPolicyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BindPolicyResponseDto> {
    return this.policiesService.bindPolicy(bindPolicyDto, user.userId);
  }

  /**
   * Get all policies for authenticated user
   */
  @Get()
  @ApiOperation({ summary: 'Get all policies for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of user policies',
    type: [PolicyDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserPolicies(@Request() req): Promise<PolicyDto[]> {
    const userId = req.user.userId;
    return this.policiesService.getUserPolicies(userId);
  }

  /**
   * Get active policies for authenticated user
   */
  @Get('active')
  @ApiOperation({ summary: 'Get active policies for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of active policies',
    type: [PolicyDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getActivePolicies(@Request() req): Promise<PolicyDto[]> {
    const userId = req.user.userId;
    return this.policiesService.getActivePolicies(userId);
  }

  /**
   * Get policies expiring soon
   */
  @Get('expiring-soon')
  @ApiOperation({ summary: 'Get policies expiring soon (within 30 days)' })
  @ApiResponse({
    status: 200,
    description: 'List of policies expiring soon',
    type: [PolicyDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPoliciesExpiringSoon(@Request() req): Promise<PolicyDto[]> {
    const userId = req.user.userId;
    return this.policiesService.getPoliciesExpiringSoon(userId);
  }

  /**
   * Renew an existing policy
   */
  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew an existing policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({
    status: 201,
    description: 'Policy renewed successfully',
    type: BindPolicyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Policy cannot be renewed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async renewPolicy(
    @Param('id') id: string,
    @Body() renewPolicyDto: RenewPolicyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BindPolicyResponseDto> {
    return this.policiesService.renewPolicy(id, renewPolicyDto, user.userId);
  }

  /**
   * Get a specific policy
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific policy by ID' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({
    status: 200,
    description: 'Policy details',
    type: PolicyDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async getPolicy(@Param('id') id: string): Promise<PolicyDto> {
    return this.policiesService.getPolicyById(id);
  }

  /**
   * Get policy by policy number
   */
  @Get('number/:policyNumber')
  @ApiOperation({ summary: 'Get a policy by policy number' })
  @ApiParam({ name: 'policyNumber', description: 'Policy number' })
  @ApiResponse({
    status: 200,
    description: 'Policy details',
    type: PolicyDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async getPolicyByNumber(
    @Param('policyNumber') policyNumber: string,
  ): Promise<PolicyDto> {
    return this.policiesService.getPolicyByNumber(policyNumber);
  }

  /**
   * Cancel a policy
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({
    status: 200,
    description: 'Policy cancelled successfully',
    type: PolicyDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async cancelPolicy(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<PolicyDto> {
    return this.policiesService.cancelPolicy(id, reason);
  }
}
