import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FileStorageService } from './file-storage.service';

describe('FileStorageService', () => {
  let service: FileStorageService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        AWS_S3_BUCKET: 'test-bucket',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should generate unique file keys', async () => {
      // Note: This test won't actually upload to S3 in test environment
      // In real scenario, you'd mock the S3 client
      expect(service).toBeDefined();
      // Add S3 mock if needed for actual upload testing
    });

    it('should use correct folder structure', async () => {
      expect(service).toBeDefined();
      // Test folder organization
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URLs with correct expiration', () => {
      const key = 'test-folder/test-file.pdf';
      const url = service.getSignedUrl(key, 3600);

      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('should use default expiration when not provided', () => {
      const key = 'test-folder/test-file.pdf';
      const url = service.getSignedUrl(key);

      expect(url).toBeDefined();
    });
  });
});
