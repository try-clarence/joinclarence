import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, AccountStatus } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    phone: '+14155551234',
    passwordHash: 'hashed-password',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    accountStatus: AccountStatus.ACTIVE,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPhone', () => {
    it('should find user by phone number', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByPhone('+14155551234');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { phone: '+14155551234' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByPhone('+14155551234');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = 'hashed-password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(
        '+14155551234',
        password,
        'test@example.com',
        'John',
        'Doe',
      );

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(repository.create).toHaveBeenCalledWith({
        phone: '+14155551234',
        passwordHash: hashedPassword,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        accountStatus: AccountStatus.ACTIVE,
      });
    });

    it('should create user without optional fields', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create('+14155551234', 'password');

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith({
        phone: '+14155551234',
        passwordHash: 'hashed-password',
        email: undefined,
        firstName: undefined,
        lastName: undefined,
        accountStatus: AccountStatus.ACTIVE,
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(mockUser, 'correct-password');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correct-password',
        mockUser.passwordHash,
      );
    });

    it('should return false for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(mockUser, 'wrong-password');

      expect(result).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateLastLogin(mockUser.id);

      expect(repository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          lastLoginAt: expect.any(Date),
        }),
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const newPassword = 'NewSecurePass123!';
      const hashedPassword = 'new-hashed-password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updatePassword(mockUser.id, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(repository.update).toHaveBeenCalledWith(mockUser.id, {
        passwordHash: hashedPassword,
      });
    });
  });

  describe('lockAccount', () => {
    it('should lock user account', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.lockAccount(mockUser.id);

      expect(repository.update).toHaveBeenCalledWith(mockUser.id, {
        accountStatus: AccountStatus.LOCKED,
      });
    });
  });

  describe('unlockAccount', () => {
    it('should unlock user account', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.unlockAccount(mockUser.id);

      expect(repository.update).toHaveBeenCalledWith(mockUser.id, {
        accountStatus: AccountStatus.ACTIVE,
      });
    });
  });
});

