import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { FileStorageService } from '../src/modules/file-storage/file-storage.service';

describe('Document Parsing API (e2e)', () => {
  let app: INestApplication;

  // Mock file storage to avoid actual S3 uploads
  const mockFileStorageService = {
    uploadFile: jest.fn().mockResolvedValue({
      key: 'test-key',
      url: 'https://s3.amazonaws.com/test-bucket/test-key',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FileStorageService)
      .useValue(mockFileStorageService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/document-parsing/parse-decpage (POST)', () => {
    it('should parse a PDF file successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', Buffer.from('PDF content'), {
          filename: 'test-document.pdf',
          contentType: 'application/pdf',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('metadata');
          expect(res.body.metadata.fileName).toBe('test-document.pdf');
          expect(res.body.metadata.fileType).toBe('application/pdf');
          expect(res.body.metadata).toHaveProperty('confidence');
          expect(res.body.metadata).toHaveProperty('parsedAt');
          expect(res.body.metadata.fileUrl).toBe(
            'https://s3.amazonaws.com/test-bucket/test-key',
          );
        });
    });

    it('should return extracted business information', () => {
      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', Buffer.from('PDF content'), {
          filename: 'business-doc.pdf',
          contentType: 'application/pdf',
        })
        .expect(200)
        .expect((res) => {
          // Check for expected business fields
          expect(res.body).toHaveProperty('legalBusinessName');
          expect(res.body).toHaveProperty('businessAddress');
          expect(res.body).toHaveProperty('city');
          expect(res.body).toHaveProperty('state');
          expect(res.body).toHaveProperty('firstName');
          expect(res.body).toHaveProperty('lastName');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('phone');
        });
    });

    it('should return mock data when OpenAI not configured', () => {
      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', Buffer.from('PDF content'), {
          filename: 'mock-test.pdf',
          contentType: 'application/pdf',
        })
        .expect(200)
        .expect((res) => {
          // Mock data should be consistent
          expect(res.body.legalBusinessName).toBe('BrightWorks LLC');
          expect(res.body.city).toBe('San Francisco');
          expect(res.body.state).toBe('CA');
          expect(res.body.zip).toBe(94103);
        });
    });

    it('should return 400 when no file is provided', () => {
      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('required');
        });
    });

    it('should return 400 for non-PDF files', () => {
      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', Buffer.from('Not a PDF'), {
          filename: 'document.txt',
          contentType: 'text/plain',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('PDF');
        });
    });

    it('should return 413 for files larger than 5MB', () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', largeBuffer, {
          filename: 'large-file.pdf',
          contentType: 'application/pdf',
        })
        .expect(413);
    });

    it('should accept files up to 5MB', () => {
      const maxSizeBuffer = Buffer.alloc(5 * 1024 * 1024); // Exactly 5MB

      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', maxSizeBuffer, {
          filename: 'max-size.pdf',
          contentType: 'application/pdf',
        })
        .expect(200);
    });

    it('should include confidence score between 0 and 1', () => {
      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', Buffer.from('PDF content'), {
          filename: 'confidence-test.pdf',
          contentType: 'application/pdf',
        })
        .expect(200)
        .expect((res) => {
          const confidence = res.body.metadata.confidence;
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(1);
          expect(typeof confidence).toBe('number');
        });
    });

    it('should return ISO 8601 formatted parsedAt timestamp', () => {
      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', Buffer.from('PDF content'), {
          filename: 'timestamp-test.pdf',
          contentType: 'application/pdf',
        })
        .expect(200)
        .expect((res) => {
          const parsedAt = res.body.metadata.parsedAt;
          expect(parsedAt).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );
          // Verify it's a valid date
          const date = new Date(parsedAt);
          expect(date.toString()).not.toBe('Invalid Date');
        });
    });

    it('should handle upload service failures gracefully', () => {
      mockFileStorageService.uploadFile.mockRejectedValueOnce(
        new Error('S3 upload failed'),
      );

      return request(app.getHttpServer())
        .post('/api/v1/document-parsing/parse-decpage')
        .attach('file', Buffer.from('PDF content'), {
          filename: 'fail-test.pdf',
          contentType: 'application/pdf',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Failed to parse document');
        });
    });
  });
});

