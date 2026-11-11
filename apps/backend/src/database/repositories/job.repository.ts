import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JobEntity } from '../entities';
import { APPLICATION_STAGE_ORDER, ApplicationStage } from '../enums';

export type StageCounts = Record<ApplicationStage, number>;

export interface JobApplicationStats {
  applicationCount: number;
  stageCounts: StageCounts;
}

export function emptyStageCounts(): StageCounts {
  return Object.fromEntries(
    APPLICATION_STAGE_ORDER.map((stage) => [stage, 0]),
  ) as StageCounts;
}

const JOB_REFERENCE_PREFIX = 'JOB-';

@Injectable()
export class JobRepository extends Repository<JobEntity> {
  constructor(private dataSource: DataSource) {
    super(JobEntity, dataSource.createEntityManager());
  }

  async nextReference(organizationId: string): Promise<string> {
    const rows: Array<{ max: number | null }> = await this.query(
      `SELECT MAX(CAST(SUBSTRING(reference FROM ${JOB_REFERENCE_PREFIX.length + 1}) AS INTEGER)) AS max
       FROM jobs
       WHERE "organizationId" = $1 AND reference ~ '^${JOB_REFERENCE_PREFIX}[0-9]+$'`,
      [organizationId],
    );
    const next = Number(rows[0]?.max ?? 0) + 1;
    return `${JOB_REFERENCE_PREFIX}${String(next).padStart(4, '0')}`;
  }

  async getApplicationStats(
    organizationId: string,
    jobIds: string[],
  ): Promise<Map<string, JobApplicationStats>> {
    const stats = new Map<string, JobApplicationStats>(
      jobIds.map((id) => [
        id,
        { applicationCount: 0, stageCounts: emptyStageCounts() },
      ]),
    );
    if (jobIds.length === 0) return stats;

    const rows: Array<{
      jobId: string;
      stage: ApplicationStage;
      count: string;
    }> = await this.query(
      `SELECT "jobId", stage, COUNT(*) AS count
         FROM applications
         WHERE "organizationId" = $1 AND "jobId" = ANY($2::uuid[])
         GROUP BY "jobId", stage`,
      [organizationId, jobIds],
    );

    for (const row of rows) {
      const entry = stats.get(row.jobId);
      if (!entry) continue;
      const count = Number(row.count);
      entry.stageCounts[row.stage] = count;
      entry.applicationCount += count;
    }
    return stats;
  }
}
