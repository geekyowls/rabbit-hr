import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@boilerplate/core';
import { CACHE_KEYS } from '@shared/cache-keys';
import { ResetLoginLockoutCommand } from './reset-login-lockout.command';

@Injectable()
export class ResetLoginLockout {
  constructor(private readonly cacheService: RedisCacheService) {}

  async execute(
    command: ResetLoginLockoutCommand,
  ): Promise<{ email: string; lockoutReset: boolean }> {
    const email = command.email.toLowerCase().trim();
    await this.cacheService.deleteKey(CACHE_KEYS.loginAttempts(email));
    return { email, lockoutReset: true };
  }
}
