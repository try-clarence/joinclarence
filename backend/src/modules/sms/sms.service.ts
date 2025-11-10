import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private client: Twilio;
  private fromNumber: string;
  private readonly mockMode: boolean;
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');
    this.mockMode = this.configService.get('SMS_MOCK_MODE') === 'true';

    if (this.mockMode) {
      this.logger.warn(
        '🔧 SMS MOCK MODE ENABLED - All SMS will be logged instead of sent. Use OTP: 111111',
      );
    } else if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio credentials not configured. SMS sending will fail.',
      );
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    const message = `Your Clarence verification code is: ${code}. Valid for 10 minutes.`;
    await this.sendSms(phone, message);
  }

  async sendPasswordResetCode(phone: string, code: string): Promise<void> {
    const message = `Your Clarence password reset code is: ${code}. Valid for 15 minutes.`;
    await this.sendSms(phone, message);
  }

  private async sendSms(to: string, body: string): Promise<void> {
    try {
      // Mock mode - just log the SMS
      if (this.mockMode) {
        this.logger.log(`📱 [MOCK SMS] To: ${to}`);
        this.logger.log(`📱 [MOCK SMS] Message: ${body}`);
        this.logger.log(`📱 [MOCK SMS] Use hardcoded OTP: 111111`);
        return;
      }

      if (!this.client) {
        this.logger.warn(`SMS would be sent to ${to}: ${body}`);
        return;
      }

      await this.client.messages.create({
        body,
        to,
        from: this.fromNumber,
      });

      this.logger.log(`SMS sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
      throw error;
    }
  }
}

