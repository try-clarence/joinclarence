import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import {
  SelectCoveragesDto,
  SubmitQuoteDto,
} from './dto/create-quote-request.dto';
import {
  QuoteRequestDto,
  QuoteRequestCoverageDto,
  GetQuoteDetailResponseDto,
  GetInsuranceOptionsResponseDto,
  InsuranceOptionDto,
} from './dto/quote-response.dto';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  /**
   * Get all quote requests
   */
  @Get()
  @ApiOperation({ summary: 'Get all quote requests' })
  @ApiResponse({
    status: 200,
    description: 'List of all quote requests',
    type: [QuoteRequestDto],
  })
  async getAllQuoteRequests(): Promise<QuoteRequestDto[]> {
    return this.quotesService.getAllQuoteRequests();
  }

  /**
   * Submit a complete quote in one call
   * Creates quote, adds coverages, validates, and submits to carriers
   */
  @Post('submit')
  @ApiOperation({
    summary: 'Submit a complete quote',
    description:
      'Creates quote, adds coverages, validates, and submits to carriers in one call',
  })
  @ApiResponse({
    status: 201,
    description: 'Quote submitted successfully',
    type: QuoteRequestDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  async submitCompleteQuote(
    @Body() submitQuoteDto: SubmitQuoteDto,
  ): Promise<QuoteRequestDto> {
    return this.quotesService.submitCompleteQuote(submitQuoteDto);
  }

  /**
   * Select coverages (Step 4)
   */
  @Post(':id/coverages')
  @ApiOperation({ summary: 'Select coverages for a quote request' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 201,
    description: 'Coverages selected successfully',
    type: [QuoteRequestCoverageDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Quote request not found',
  })
  async selectCoverages(
    @Param('id') id: string,
    @Body() selectCoveragesDto: SelectCoveragesDto,
  ): Promise<QuoteRequestCoverageDto[]> {
    return this.quotesService.selectCoverages(id, selectCoveragesDto);
  }

  /**
   * Submit quote request to get quotes from carriers
   */
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit quote request to carriers' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 201,
    description: 'Quote request submitted to carriers',
    type: QuoteRequestDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Quote already submitted or validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote request not found',
  })
  async submitQuoteRequest(@Param('id') id: string): Promise<QuoteRequestDto> {
    return this.quotesService.submitQuoteRequest(id);
  }

  /**
   * Get quote request with quotes
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get quote request with carrier quotes' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote request with coverages and carrier quotes',
    type: GetQuoteDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Quote request not found',
  })
  async getQuoteRequest(
    @Param('id') id: string,
  ): Promise<GetQuoteDetailResponseDto> {
    return this.quotesService.getQuoteRequestWithQuotes(id);
  }

  /**
   * Get insurance options for a quote request
   * Transforms carrier quotes into frontend-friendly insurance options
   */
  @Get(':id/options')
  @ApiOperation({
    summary: 'Get insurance options for a quote request',
    description:
      'Transforms carrier quotes into frontend-friendly insurance options',
  })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Insurance options for the quote request',
    type: GetInsuranceOptionsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Quote request not found',
  })
  async getInsuranceOptions(
    @Param('id') id: string,
  ): Promise<GetInsuranceOptionsResponseDto> {
    return this.quotesService.getInsuranceOptions(id);
  }

  /**
   * Get a specific insurance option by ID
   */
  @Get(':quoteId/options/:optionId')
  @ApiOperation({
    summary: 'Get a specific insurance option',
    description: 'Returns details for a single insurance option',
  })
  @ApiParam({ name: 'quoteId', description: 'Quote request ID' })
  @ApiParam({ name: 'optionId', description: 'Insurance option ID' })
  @ApiResponse({
    status: 200,
    description: 'Insurance option details',
    type: InsuranceOptionDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Quote request or option not found',
  })
  async getInsuranceOptionById(
    @Param('quoteId') quoteId: string,
    @Param('optionId') optionId: string,
  ): Promise<InsuranceOptionDto> {
    return this.quotesService.getInsuranceOptionById(quoteId, optionId);
  }

  /**
   * Delete a quote request (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quote request (soft delete)' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote request deleted successfully',
    type: QuoteRequestDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete a purchased quote request',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote request not found',
  })
  async deleteQuoteRequest(@Param('id') id: string): Promise<QuoteRequestDto> {
    return this.quotesService.deleteQuoteRequest(id);
  }
}
