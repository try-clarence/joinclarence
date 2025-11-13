import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { DocumentParsingController } from './document-parsing.controller';
import { DocumentParsingService } from './document-parsing.service';

describe('DocumentParsingController', () => {
  let controller: DocumentParsingController;
  let service: DocumentParsingService;

  const mockDocumentParsingService = {
    parseDecPage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentParsingController],
      providers: [
        {
          provide: DocumentParsingService,
          useValue: mockDocumentParsingService,
        },
      ],
    }).compile();

    controller = module.get<DocumentParsingController>(
      DocumentParsingController,
    );
    service = module.get<DocumentParsingService>(DocumentParsingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('parseDecPage', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('test'),
      size: 1024,
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    const mockResult = {
      legalBusinessName: 'Test Company',
      businessAddress: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: 94103,
      metadata: {
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        parsedAt: '2025-11-10T12:00:00Z',
        confidence: 0.95,
      },
    };

    it('should parse a valid PDF file', async () => {
      mockDocumentParsingService.parseDecPage.mockResolvedValue(mockResult);

      const result = await controller.parseDecPage(mockFile);

      expect(result).toEqual(mockResult);
      expect(service.parseDecPage).toHaveBeenCalledWith(mockFile);
    });

    it('should throw BadRequestException when file is not provided', async () => {
      await expect(controller.parseDecPage(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw PayloadTooLargeException for files larger than 5MB', async () => {
      const largeFile = {
        ...mockFile,
        size: 6 * 1024 * 1024, // 6MB
      };

      await expect(controller.parseDecPage(largeFile)).rejects.toThrow(
        PayloadTooLargeException,
      );
    });

    it('should accept files up to 5MB', async () => {
      const exactSizeFile = {
        ...mockFile,
        size: 5 * 1024 * 1024, // Exactly 5MB
      };

      mockDocumentParsingService.parseDecPage.mockResolvedValue(mockResult);

      const result = await controller.parseDecPage(exactSizeFile);

      expect(result).toEqual(mockResult);
    });
  });
});
