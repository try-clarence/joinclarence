import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { DocumentParsingService } from './document-parsing.service';
import { ParseDecPageResponseDto } from './dto/parse-decpage-response.dto';

@ApiTags('Document Parsing')
@Controller('document-parsing')
export class DocumentParsingController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
  ) {}

  @Post('parse-decpage')
  @ApiOperation({ summary: 'Parse DEC page or business document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          return callback(
            new BadRequestException('Only PDF files are supported'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async parseDecPage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ParseDecPageResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new PayloadTooLargeException('File size exceeds 5MB limit');
    }

    return this.documentParsingService.parseDecPage(file);
  }
}

