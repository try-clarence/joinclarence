import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentParsingService } from './document-parsing.service';
import { FileStorageService } from '../file-storage/file-storage.service';

describe('DocumentParsingService', () => {
  let service: DocumentParsingService;
  let fileStorageService: FileStorageService;
  let configService: ConfigService;

  const mockFileStorageService = {
    uploadFile: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentParsingService,
        {
          provide: FileStorageService,
          useValue: mockFileStorageService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DocumentParsingService>(DocumentParsingService);
    fileStorageService = module.get<FileStorageService>(FileStorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseDecPage', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
      size: 1024,
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    it('should parse PDF and return structured data', async () => {
      mockFileStorageService.uploadFile.mockResolvedValue({
        key: 'test-key',
        url: 'https://s3.amazonaws.com/test-key',
      });

      mockConfigService.get.mockReturnValue(null); // No OpenAI key, use mock data

      const result = await service.parseDecPage(mockFile);

      expect(result).toHaveProperty('metadata');
      expect(result.metadata.fileName).toBe('test-document.pdf');
      expect(result.metadata.fileType).toBe('application/pdf');
      expect(result.metadata.fileSize).toBe(1024);
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeLessThanOrEqual(1);
      expect(result.metadata.fileUrl).toBe('https://s3.amazonaws.com/test-key');
      
      // Check for expected fields
      expect(result).toHaveProperty('legalBusinessName');
      expect(result).toHaveProperty('businessAddress');
      expect(result).toHaveProperty('firstName');
    });

    it('should return mock data when OpenAI is not configured', async () => {
      mockFileStorageService.uploadFile.mockResolvedValue({
        key: 'test-key',
        url: 'https://s3.amazonaws.com/test-key',
      });

      mockConfigService.get.mockReturnValue(null);

      const result = await service.parseDecPage(mockFile);

      expect(result.legalBusinessName).toBe('BrightWorks LLC');
      expect(result.city).toBe('San Francisco');
      expect(result.state).toBe('CA');
    });

    it('should include confidence score in metadata', async () => {
      mockFileStorageService.uploadFile.mockResolvedValue({
        key: 'test-key',
        url: 'https://s3.amazonaws.com/test-key',
      });

      mockConfigService.get.mockReturnValue(null);

      const result = await service.parseDecPage(mockFile);

      expect(result.metadata.confidence).toBeDefined();
      expect(typeof result.metadata.confidence).toBe('number');
    });

    it('should handle upload failure', async () => {
      mockFileStorageService.uploadFile.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(service.parseDecPage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include parsedAt timestamp', async () => {
      mockFileStorageService.uploadFile.mockResolvedValue({
        key: 'test-key',
        url: 'https://s3.amazonaws.com/test-key',
      });

      mockConfigService.get.mockReturnValue(null);

      const before = new Date();
      const result = await service.parseDecPage(mockFile);
      const after = new Date();

      const parsedAt = new Date(result.metadata.parsedAt);
      expect(parsedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(parsedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});

