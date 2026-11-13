import { Injectable, Optional } from '@nestjs/common';
import { RedisCacheService } from '@boilerplate/core';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import { OnboardingChecklistDto } from './dtos/onboarding.dto';

@Injectable()
export class OnboardingCache {
  constructor(@Optional() private readonly cacheService?: RedisCacheService) {}

  async read(organizationId: string): Promise<OnboardingChecklistDto | null> {
    if (!this.cacheService) return null;
    try {
      const raw: string | null = await this.cacheService.getString(
        CACHE_KEYS.onboardingChecklist(organizationId),
      );
      return raw ? (JSON.parse(raw) as OnboardingChecklistDto) : null;
    } catch {
      return null;
    }
  }

  async write(
    organizationId: string,
    checklist: OnboardingChecklistDto,
  ): Promise<void> {
    if (!this.cacheService) return;
    try {
      await this.cacheService.setString(
        CACHE_KEYS.onboardingChecklist(organizationId),
        JSON.stringify(checklist),
        CACHE_TTL.ONBOARDING_CHECKLIST,
      );
    } catch {
      return;
    }
  }

  async invalidate(organizationId: string): Promise<void> {
    if (!this.cacheService) return;
    try {
      await this.cacheService.deleteKey(
        CACHE_KEYS.onboardingChecklist(organizationId),
      );
    } catch {
      return;
    }
  }
}
