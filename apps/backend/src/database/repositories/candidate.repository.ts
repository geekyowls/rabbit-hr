import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CandidateEntity } from '../entities';

export interface CandidateLatestApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  stage: string;
  stageChangedAt: Date;
}

export interface CandidateApplicationStats {
  applicationCount: number;
  latestApplication: CandidateLatestApplication | null;
}

@Injectable()
export class CandidateRepository extends Repository<CandidateEntity> {
  constructor(private dataSource: DataSource) {
    super(CandidateEntity, dataSource.createEntityManager());
  }

  async getApplicationStats(
    organizationId: string,
    candidateIds: string[],
  ): Promise<Map<string, CandidateApplicationStats>> {
    const stats = new Map<string, CandidateApplicationStats>(
      candidateIds.map((id) => [
        id,
        { applicationCount: 0, latestApplication: null },
      ]),
    );
    if (candidateIds.length === 0) return stats;

    const rows: Array<{
      candidateId: string;
      applicationCount: string;
      id: string;
      jobId: string;
      jobTitle: string;
      stage: string;
      stageChangedAt: Date;
    }> = await this.query(
      `SELECT DISTINCT ON (a."candidateId")
         a."candidateId",
         COUNT(*) OVER (PARTITION BY a."candidateId") AS "applicationCount",
         a.id, a."jobId", j.title AS "jobTitle", a.stage, a."stageChangedAt"
       FROM applications a
       JOIN jobs j ON j.id = a."jobId"
       WHERE a."organizationId" = $1 AND a."candidateId" = ANY($2::uuid[])
       ORDER BY a."candidateId", a."stageChangedAt" DESC`,
      [organizationId, candidateIds],
    );

    for (const row of rows) {
      stats.set(row.candidateId, {
        applicationCount: Number(row.applicationCount),
        latestApplication: {
          id: row.id,
          jobId: row.jobId,
          jobTitle: row.jobTitle,
          stage: row.stage,
          stageChangedAt: row.stageChangedAt,
        },
      });
    }
    return stats;
  }
}
