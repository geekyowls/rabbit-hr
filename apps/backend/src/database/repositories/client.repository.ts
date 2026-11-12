import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ClientEntity } from '../entities';
import { JobStatus, PipelineStageCategory } from '../enums';

export interface ClientStats {
  contactCount: number;
  jobCount: number;
  openJobCount: number;
  applicationCount: number;
  placementCount: number;
}

const EMPTY_STATS: ClientStats = {
  contactCount: 0,
  jobCount: 0,
  openJobCount: 0,
  applicationCount: 0,
  placementCount: 0,
};

@Injectable()
export class ClientRepository extends Repository<ClientEntity> {
  constructor(private dataSource: DataSource) {
    super(ClientEntity, dataSource.createEntityManager());
  }

  async getStats(
    organizationId: string,
    clientIds: string[],
  ): Promise<Map<string, ClientStats>> {
    const stats = new Map<string, ClientStats>(
      clientIds.map((id) => [id, { ...EMPTY_STATS }]),
    );
    if (clientIds.length === 0) return stats;

    const rows: Array<{
      clientId: string;
      contactCount: string;
      jobCount: string;
      openJobCount: string;
      applicationCount: string;
      placementCount: string;
    }> = await this.query(
      `SELECT c.id AS "clientId",
        (SELECT COUNT(*) FROM client_contacts cc WHERE cc."clientId" = c.id) AS "contactCount",
        (SELECT COUNT(*) FROM jobs j WHERE j."clientId" = c.id) AS "jobCount",
        (SELECT COUNT(*) FROM jobs j WHERE j."clientId" = c.id AND j.status = $3) AS "openJobCount",
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a."jobId" WHERE j."clientId" = c.id) AS "applicationCount",
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a."jobId" JOIN pipeline_stages ps ON ps."organizationId" = a."organizationId" AND ps.key = a.stage WHERE j."clientId" = c.id AND ps.category = $4) AS "placementCount"
       FROM clients c
       WHERE c."organizationId" = $1 AND c.id = ANY($2::uuid[])`,
      [
        organizationId,
        clientIds,
        JobStatus.PUBLISHED,
        PipelineStageCategory.HIRED,
      ],
    );

    for (const row of rows) {
      stats.set(row.clientId, {
        contactCount: Number(row.contactCount),
        jobCount: Number(row.jobCount),
        openJobCount: Number(row.openJobCount),
        applicationCount: Number(row.applicationCount),
        placementCount: Number(row.placementCount),
      });
    }
    return stats;
  }
}
