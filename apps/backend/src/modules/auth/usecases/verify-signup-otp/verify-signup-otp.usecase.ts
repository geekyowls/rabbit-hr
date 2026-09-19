import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisCacheService } from '@boilerplate/core';
import { EmailVerificationRepository } from '@db/repositories';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import { VerifySignupOtpCommand } from './verify-signup-otp.command';

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATIONS = [60, 300, 900];

@Injectable()
export class VerifySignupOtp {
  constructor(
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  private async checkLockout(email: string): Promise<void> {
    const lockoutKey = CACHE_KEYS.otpLockout(email);
    const isLocked = await this.cacheService.getString(lockoutKey);

    if (isLocked) {
      const ttl = await this.cacheService.client.ttl(lockoutKey);
      const minutesRemaining = Math.ceil(ttl / 60);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed attempts. Please try again in ${minutesRemaining} minute(s).`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordFailedAttempt(email: string): Promise<void> {
    const countKey = CACHE_KEYS.otpLockoutCount(email);
    const lockoutKey = CACHE_KEYS.otpLockout(email);

    const countStr = await this.cacheService.getString(countKey);
    const count = countStr ? parseInt(countStr, 10) : 0;

    const lockoutIndex = Math.min(count, LOCKOUT_DURATIONS.length - 1);
    const lockoutDuration = LOCKOUT_DURATIONS[lockoutIndex];

    await this.cacheService.setString(lockoutKey, '1', lockoutDuration);
    await this.cacheService.setString(
      countKey,
      (count + 1).toString(),
      CACHE_TTL.OTP_LOCKOUT_COUNT,
    );
  }

  private async clearLockout(email: string): Promise<void> {
    const countKey = CACHE_KEYS.otpLockoutCount(email);
    const lockoutKey = CACHE_KEYS.otpLockout(email);
    await this.cacheService.deleteKey(countKey);
    await this.cacheService.deleteKey(lockoutKey);
  }

  async execute(
    command: VerifySignupOtpCommand,
  ): Promise<{ verified: boolean; email: string }> {
    const email = command.email.toLowerCase().trim();

    await this.checkLockout(email);

    const verification =
      await this.emailVerificationRepository.findByEmail(email);

    if (!verification) {
      throw new BadRequestException(
        'No OTP found for this email. Please request a new OTP.',
      );
    }

    if (verification.verified) {
      return { verified: true, email };
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      await this.recordFailedAttempt(email);
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    if (verification.otpCode !== command.otp) {
      verification.attempts += 1;
      await this.emailVerificationRepository.save(verification);

      if (verification.attempts >= MAX_ATTEMPTS) {
        await this.recordFailedAttempt(email);
      }

      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    verification.verified = true;
    await this.emailVerificationRepository.save(verification);
    await this.clearLockout(email);

    return { verified: true, email };
  }
}
