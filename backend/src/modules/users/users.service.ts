import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(
    phone: string,
    password: string,
    email?: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = this.usersRepository.create({
      phone,
      passwordHash,
      email,
      firstName,
      lastName,
      accountStatus: AccountStatus.ACTIVE,
    });

    return this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersRepository.update(userId, { passwordHash });
  }

  async lockAccount(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      accountStatus: AccountStatus.LOCKED,
    });
  }

  async unlockAccount(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      accountStatus: AccountStatus.ACTIVE,
    });
  }
}
