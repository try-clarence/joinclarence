import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Policies E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register a user for testing
    const phone = `+1555${Date.now().toString().slice(-7)}`;

    // Send verification code
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-code')
      .send({ phone, purpose: 'registration' })
      .expect(200);

    const verificationId = verifyResponse.body.verificationId;

    // Verify code
    const codeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-code')
      .send({
        verificationId,
        code: '111111',
      })
      .expect(200);

    const verificationToken = codeResponse.body.verificationToken;

    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        verificationToken,
        password: 'TestPass123!',
      })
      .expect(201);

    accessToken = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test user
    if (userId) {
      await dataSource.query('DELETE FROM payments WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query('DELETE FROM policies WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    await app.close();
  });

  describe('GET /api/v1/policies', () => {
    it('should return user policies (empty for new user)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/policies').expect(401);
    });
  });

  describe('GET /api/v1/policies/active', () => {
    it('should return active policies for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/policies/active')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // All returned policies should have active-like status
      response.body.forEach((policy: any) => {
        expect(['bound', 'active']).toContain(policy.status);
      });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/active')
        .expect(401);
    });
  });

  describe('GET /api/v1/policies/expiring-soon', () => {
    it('should return expiring policies for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/policies/expiring-soon')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/expiring-soon')
        .expect(401);
    });
  });

  describe('GET /api/v1/policies/:id', () => {
    it('should return 404 for non-existent policy', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/api/v1/policies/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/api/v1/policies/${fakeUuid}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/policies/bind', () => {
    it('should fail to bind with invalid carrier quote ID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .post('/api/v1/policies/bind')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          carrierQuoteId: fakeUuid,
          userId,
          paymentPlan: 'monthly',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .post('/api/v1/policies/bind')
        .send({
          carrierQuoteId: fakeUuid,
          userId: 'test',
          paymentPlan: 'monthly',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/policies/:id/renew', () => {
    it('should fail to renew non-existent policy', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .post(`/api/v1/policies/${fakeUuid}/renew`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          paymentPlan: 'annual',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .post(`/api/v1/policies/${fakeUuid}/renew`)
        .send({
          paymentPlan: 'annual',
        })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/policies/:id', () => {
    it('should fail to cancel non-existent policy', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .delete(`/api/v1/policies/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(404);
    });

    it('should fail without authentication', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .delete(`/api/v1/policies/${fakeUuid}`)
        .expect(401);
    });
  });
});
