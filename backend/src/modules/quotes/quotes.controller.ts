import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import {
  CreateQuoteRequestDto,
  SelectCoveragesDto,
  SubmitQuoteRequestDto,
} from './dto/create-quote-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  /**
   * Create a new quote request (Step 1)
   */
  @Post()
  async createQuoteRequest(@Body() createQuoteRequestDto: CreateQuoteRequestDto) {
    return this.quotesService.createQuoteRequest(createQuoteRequestDto);
  }

  /**
   * Update quote request (Steps 2-5)
   */
  @Put(':id')
  async updateQuoteRequest(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateQuoteRequestDto>,
  ) {
    return this.quotesService.updateQuoteRequest(id, updateData);
  }

  /**
   * Select coverages (Step 4)
   */
  @Post(':id/coverages')
  async selectCoverages(
    @Param('id') id: string,
    @Body() selectCoveragesDto: SelectCoveragesDto,
  ) {
    return this.quotesService.selectCoverages(id, selectCoveragesDto);
  }

  /**
   * Submit quote request to get quotes from carriers
   */
  @Post(':id/submit')
  async submitQuoteRequest(@Param('id') id: string) {
    return this.quotesService.submitQuoteRequest(id);
  }

  /**
   * Get quote request with quotes
   */
  @Get(':id')
  async getQuoteRequest(@Param('id') id: string) {
    return this.quotesService.getQuoteRequestWithQuotes(id);
  }

  /**
   * Get quote request by session ID
   */
  @Get('session/:sessionId')
  async getQuoteRequestBySession(@Param('sessionId') sessionId: string) {
    return this.quotesService.getQuoteRequestBySession(sessionId);
  }
}
