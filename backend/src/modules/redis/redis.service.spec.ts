import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

// Create mock store outside the mock factory
const mockStore = new Map<string, { value: string; expiresAt?: number }>();

// Mock ioredis with proper default export
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string) => {
      const entry = mockStore.get(key);
      if (!entry) return Promise.resolve(null);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        mockStore.delete(key);
        return Promise.resolve(null);
      }
      return Promise.resolve(entry.value);
    }),
    set: jest.fn((key: string, value: string) => {
      mockStore.set(key, { value });
      return Promise.resolve('OK');
    }),
    setex: jest.fn((key: string, ttl: number, value: string) => {
      mockStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
      return Promise.resolve('OK');
    }),
    del: jest.fn((key: string) => {
      mockStore.delete(key);
      return Promise.resolve(1);
    }),
    incr: jest.fn((key: string) => {
      const entry = mockStore.get(key);
      const newValue = entry ? parseInt(entry.value, 10) + 1 : 1;
      mockStore.set(key, {
        value: newValue.toString(),
        expiresAt: entry?.expiresAt,
      });
      return Promise.resolve(newValue);
    }),
    expire: jest.fn((key: string, ttl: number) => {
      const entry = mockStore.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + ttl * 1000;
      }
      return Promise.resolve(1);
    }),
    exists: jest.fn((key: string) => {
      const entry = mockStore.get(key);
      if (!entry) return Promise.resolve(0);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        mockStore.delete(key);
        return Promise.resolve(0);
      }
      return Promise.resolve(1);
    }),
    disconnect: jest.fn(),
  }));

  return {
    __esModule: true,
    default: MockRedis,
  };
});

describe('RedisService', () => {
  let service: RedisService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
      };
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  };

  beforeEach(async () => {
    // Clear the mock store before each test
    mockStore.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should set and get a value', async () => {
      await service.set('test-key', 'test-value');
      const value = await service.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should set value with TTL', async () => {
      await service.set('ttl-key', 'ttl-value', 1);
      const value = await service.get('ttl-key');
      expect(value).toBe('ttl-value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const expiredValue = await service.get('ttl-key');
      expect(expiredValue).toBeNull();
    });

    it('should return null for non-existent key', async () => {
      const value = await service.get('non-existent-key');
      expect(value).toBeNull();
    });
  });

  describe('setJson and getJson', () => {
    it('should set and get JSON object', async () => {
      const testObject = {
        name: 'Test',
        age: 25,
        active: true,
      };

      await service.setJson('json-key', testObject);
      const value = await service.getJson('json-key');
      expect(value).toEqual(testObject);
    });

    it('should handle complex nested objects', async () => {
      const complexObject = {
        user: {
          id: 123,
          profile: {
            name: 'John',
            settings: {
              notifications: true,
            },
          },
        },
        tags: ['tag1', 'tag2'],
      };

      await service.setJson('complex-key', complexObject);
      const value = await service.getJson('complex-key');
      expect(value).toEqual(complexObject);
    });

    it('should return null for non-existent JSON key', async () => {
      const value = await service.getJson('non-existent-json-key');
      expect(value).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      await service.set('delete-key', 'delete-value');
      await service.del('delete-key');
      const value = await service.get('delete-key');
      expect(value).toBeNull();
    });
  });

  describe('incr', () => {
    it('should increment a counter', async () => {
      const count1 = await service.incr('counter');
      expect(count1).toBe(1);

      const count2 = await service.incr('counter');
      expect(count2).toBe(2);

      const count3 = await service.incr('counter');
      expect(count3).toBe(3);
    });
  });

  describe('expire', () => {
    it('should set expiration on existing key', async () => {
      await service.set('expire-key', 'expire-value');
      await service.expire('expire-key', 1);

      const valueBefore = await service.get('expire-key');
      expect(valueBefore).toBe('expire-value');

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const valueAfter = await service.get('expire-key');
      expect(valueAfter).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      await service.set('exists-key', 'exists-value');
      const exists = await service.exists('exists-key');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await service.exists('non-existent-key');
      expect(exists).toBe(false);
    });
  });

  afterEach(() => {
    if (service) {
      service.onModuleDestroy();
    }
  });
});
