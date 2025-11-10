import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { FileStorageService } from '../file-storage/file-storage.service';
import { ParseDecPageResponseDto } from './dto/parse-decpage-response.dto';

@Injectable()
export class DocumentParsingService {
  private openai: OpenAI;
  private readonly logger = new Logger(DocumentParsingService.name);

  constructor(
    private configService: ConfigService,
    private fileStorageService: FileStorageService,
  ) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not configured');
    }
  }

  async parseDecPage(
    file: Express.Multer.File,
  ): Promise<ParseDecPageResponseDto> {
    this.logger.log(`Parsing DEC page: ${file.originalname}`);

    try {
      // Upload file to S3 (optional)
      const { url: fileUrl } = await this.fileStorageService.uploadFile(
        file,
        'decpages',
      );

      // Convert PDF to base64
      const base64File = file.buffer.toString('base64');

      // Call OpenAI Vision API
      const extractedData = await this.extractDataWithLLM(base64File);

      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedData);

      return {
        ...extractedData,
        metadata: {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          parsedAt: new Date().toISOString(),
          confidence,
          fileUrl,
        },
      };
    } catch (error) {
      this.logger.error('Failed to parse DEC page', error);
      throw new BadRequestException('Failed to parse document');
    }
  }

  private async extractDataWithLLM(base64File: string): Promise<any> {
    if (!this.openai) {
      // For development without OpenAI API key, return mock data
      this.logger.warn('OpenAI not configured, returning mock data');
      return this.getMockData();
    }

    const prompt = `You are an expert at extracting business information from insurance documents and DEC pages.

Extract the following information from the provided document. Return ONLY valid JSON with no additional text.

Required format:
{
  "legalBusinessName": "string or null",
  "doingBusinessAs": "string or null",
  "legalStructure": "llc|corporation|partnership|sole-proprietorship or null",
  "businessWebsite": "string or null",
  "primaryIndustry": "string or null",
  "businessDescription": "string or null",
  "businessFen": "string or null",
  "yearBusinessStarted": "string (YYYY) or null",
  "yearsUnderCurrentOwnership": "string or null",
  "addressType": ["physical"] or null,
  "businessAddress": "string or null",
  "city": "string or null",
  "state": "string (2-letter code) or null",
  "zip": number or null,
  "hasSubsidiaries": "yes|no or null",
  "hasForeignSubsidiaries": "yes|no or null",
  "seekingMultipleEntities": "yes|no or null",
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "lastYearRevenue": number or null,
  "estimatedCurrentYearRevenue": number or null,
  "lastYearExpenses": number or null,
  "estimatedCurrentYearExpenses": number or null,
  "numberOfEmployees": number or null,
  "numberOfPartTimeEmployees": number or null,
  "estimatedTotalPayroll": number or null,
  "independentContractorsPayrollPercent": number or null
}

Important:
- Return null for any field not found in the document
- Extract numbers without currency symbols or commas
- Phone numbers should be in format: +1XXXXXXXXXX
- State should be 2-letter code (e.g., CA, NY)
- Ensure all JSON is valid and properly formatted`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4-vision-preview'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64File}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('OpenAI API call failed', error);
      throw error;
    }
  }

  private calculateConfidence(data: any): number {
    const fields = Object.keys(data);
    const filledFields = fields.filter(
      (key) => data[key] !== null && data[key] !== undefined,
    );
    return filledFields.length / fields.length;
  }

  private getMockData(): any {
    return {
      legalBusinessName: 'BrightWorks LLC',
      doingBusinessAs: 'BrightWorks Design',
      legalStructure: 'llc',
      businessWebsite: 'https://brightworksdesign.com',
      primaryIndustry: 'Construction',
      businessDescription: 'Commercial design and renovation services.',
      businessFen: '123456789',
      addressType: ['physical'],
      businessAddress: '1450 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zip: 94103,
      hasSubsidiaries: 'no',
      hasForeignSubsidiaries: 'no',
      seekingMultipleEntities: 'no',
      yearBusinessStarted: '2014',
      yearsUnderCurrentOwnership: '11',
      firstName: 'Alex',
      lastName: 'Nguyen',
      email: 'alex@brightworks.com',
      phone: '+14155557890',
      lastYearRevenue: 1200000,
      estimatedCurrentYearRevenue: 1400000,
      lastYearExpenses: 800000,
      estimatedCurrentYearExpenses: 950000,
      numberOfEmployees: 25,
      numberOfPartTimeEmployees: 5,
      estimatedTotalPayroll: 750000,
      independentContractorsPayrollPercent: 10,
    };
  }
}

