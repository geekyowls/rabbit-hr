import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { UserSessionEntity } from '../entities/user-session.entity';

@Injectable()
export class UserSessionRepository extends Repository<UserSessionEntity> {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly repository: Repository<UserSessionEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async createSession(input: {
    userId: string;
    organizationId: string;
    jti: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<UserSessionEntity> {
    const session = this.create({
      userId: input.userId,
      organizationId: input.organizationId,
      jti: input.jti,
      expiresAt: input.expiresAt,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      lastUsedAt: new Date(),
      revokedAt: null,
    });
    return this.save(session);
  }

  async findActiveByJti(jti: string): Promise<UserSessionEntity | null> {
    return this.findOne({
      where: { jti, revokedAt: IsNull() },
    });
  }

  async findActiveForUser(userId: string): Promise<UserSessionEntity[]> {
    return this.find({
      where: { userId, revokedAt: IsNull() },
      order: { lastUsedAt: 'DESC' },
    });
  }

  async findActiveForOrganization(
    organizationId: string,
  ): Promise<UserSessionEntity[]> {
    return this.find({
      where: {
        organizationId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
      order: { lastUsedAt: 'DESC' },
    });
  }

  async revokeByIdForOrganization(
    id: string,
    organizationId: string,
  ): Promise<boolean> {
    const result = await this.update(
      { id, organizationId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.update({ jti }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async touchLastUsed(jti: string): Promise<void> {
    await this.update({ jti }, { lastUsedAt: new Date() });
  }
}
