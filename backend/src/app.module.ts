import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentParsingModule } from './modules/document-parsing/document-parsing.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SmsModule } from './modules/sms/sms.module';
import { RedisModule } from './modules/redis/redis.module';
import { FileStorageModule } from './modules/file-storage/file-storage.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { PoliciesModule } from './modules/policies/policies.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Always use migrations in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    DocumentParsingModule,
    AuthModule,
    UsersModule,
    SmsModule,
    RedisModule,
    FileStorageModule,
    CarriersModule,
    QuotesModule,
    PoliciesModule,
  ],
})
export class AppModule {}
