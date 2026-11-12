import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CandidatePortalSessionEntity } from '../entities';

@Injectable()
export class CandidatePortalSessionRepository extends Repository<CandidatePortalSessionEntity> {
  constructor(private dataSource: DataSource) {
    super(CandidatePortalSessionEntity, dataSource.createEntityManager());
  }

  async findActiveByJti(
    jti: string,
  ): Promise<CandidatePortalSessionEntity | null> {
    return this.findOne({ where: { jti, revokedAt: IsNull() } });
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.update({ jti, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
