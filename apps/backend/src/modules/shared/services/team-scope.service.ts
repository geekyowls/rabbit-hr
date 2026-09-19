import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '@boilerplate/core';
import { UserRepository } from '@db/repositories';
import { CACHE_KEYS, CACHE_TTL } from '../cache-keys';

@Injectable()
export class TeamScopeService {
  private readonly logger = new Logger(TeamScopeService.name);

  constructor(
    private readonly redisCacheService: RedisCacheService,
    private readonly userRepository: UserRepository,
  ) {}

  async getTeamMemberIds(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const cacheKey = CACHE_KEYS.teamDescendants(organizationId, userId);

    try {
      const cached: string | null =
        await this.redisCacheService.getString(cacheKey);
      if (cached) {
        return JSON.parse(cached) as string[];
      }
    } catch (error) {
      this.logger.warn(
        'Redis read failed for team cache, falling back to DB',
        error,
      );
    }

    const ids = await this.queryTeamMemberIds(userId, organizationId);

    try {
      await this.redisCacheService.setString(
        cacheKey,
        JSON.stringify(ids),
        CACHE_TTL.TEAM_DESCENDANTS,
      );
      const orgSetKey = CACHE_KEYS.teamOrgKeys(organizationId);
      await this.redisCacheService.client.sadd(orgSetKey, cacheKey);
      await this.redisCacheService.client.expire(
        orgSetKey,
        CACHE_TTL.TEAM_DESCENDANTS * 2,
      );
    } catch (error) {
      this.logger.warn('Redis write failed for team cache', error);
    }

    return ids;
  }

  async invalidateOrgTeamCache(organizationId: string): Promise<void> {
    try {
      const orgSetKey = CACHE_KEYS.teamOrgKeys(organizationId);
      const memberKeys = await this.redisCacheService.getSet(orgSetKey);
      for (const key of memberKeys) {
        await this.redisCacheService.deleteKey(key);
      }
      await this.redisCacheService.deleteKey(orgSetKey);
    } catch (error) {
      this.logger.warn('Failed to invalidate org team cache', error);
    }
  }

  private async queryTeamMemberIds(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId },
      select: ['id', 'path'],
    });

    if (!user) {
      return [userId];
    }

    const userPath = user.path || `/${userId}/`;

    const descendants: { id: string }[] = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .where('user.path LIKE :pathPrefix', { pathPrefix: `${userPath}%` })
      .andWhere('user.id != :userId', { userId })
      .andWhere('user.organizationId = :organizationId', { organizationId })
      .getMany();

    return [userId, ...descendants.map((d) => d.id)];
  }
}
