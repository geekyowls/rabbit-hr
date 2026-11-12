import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';
import { RedisCacheService } from '@boilerplate/core';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import { portalTokenSecret } from './portal-token.config';

export const PORTAL_OTP_MAX_REQUESTS = 5;
export const PORTAL_OTP_MAX_ATTEMPTS = 5;
export const PORTAL_OTP_EXPIRY_MINUTES = CACHE_TTL.PORTAL_OTP / 60;

interface StoredOtp {
  hash: string;
  attempts: number;
}

export type OtpCheckResult = 'valid' | 'invalid' | 'locked';

@Injectable()
export class PortalOtpStore {
  constructor(
    private readonly cache: RedisCacheService,
    private readonly config: ConfigService,
  ) {}

  private emailHash(email: string): string {
    return createHash('sha256').update(email).digest('hex').slice(0, 32);
  }

  private hashCode(organizationId: string, email: string, code: string) {
    return createHmac('sha256', portalTokenSecret(this.config, 'access'))
      .update(`${organizationId}:${email}:${code}`)
      .digest('hex');
  }

  async assertCanRequest(organizationId: string, email: string) {
    const key = CACHE_KEYS.portalOtpRate(organizationId, this.emailHash(email));
    const count = await this.cache.client.incr(key);
    if (count === 1) {
      await this.cache.client.expire(key, CACHE_TTL.PORTAL_OTP_RATE);
    }
    if (count > PORTAL_OTP_MAX_REQUESTS) {
      throw new HttpException(
        'Too many code requests. Please wait a few minutes and try again',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async issue(organizationId: string, email: string): Promise<string> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const stored: StoredOtp = {
      hash: this.hashCode(organizationId, email, code),
      attempts: 0,
    };
    await this.cache.setString(
      CACHE_KEYS.portalOtp(organizationId, this.emailHash(email)),
      JSON.stringify(stored),
      CACHE_TTL.PORTAL_OTP,
    );
    return code;
  }

  async check(
    organizationId: string,
    email: string,
    code: string,
  ): Promise<OtpCheckResult> {
    const key = CACHE_KEYS.portalOtp(organizationId, this.emailHash(email));
    const raw = (await this.cache.getString(key)) as string | null;
    if (!raw) return 'invalid';
    const stored = JSON.parse(raw) as StoredOtp;
    if (stored.attempts >= PORTAL_OTP_MAX_ATTEMPTS) {
      await this.cache.deleteKey(key);
      return 'locked';
    }
    const expected = Buffer.from(stored.hash, 'hex');
    const actual = Buffer.from(
      this.hashCode(organizationId, email, code),
      'hex',
    );
    if (
      expected.length === actual.length &&
      timingSafeEqual(expected, actual)
    ) {
      await this.cache.deleteKey(key);
      return 'valid';
    }
    stored.attempts += 1;
    if (stored.attempts >= PORTAL_OTP_MAX_ATTEMPTS) {
      await this.cache.deleteKey(key);
      return 'locked';
    }
    await this.cache.client.set(key, JSON.stringify(stored), 'KEEPTTL');
    return 'invalid';
  }
}
