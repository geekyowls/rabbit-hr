import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationRepository, CandidateRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

@Injectable()
export class GetCandidate {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(candidateId: string, organizationId: string) {
    const candidate = await this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoin('candidate.owner', 'owner')
      .addSelect(safeUserSelect('owner'))
      .where('candidate.id = :candidateId', { candidateId })
      .andWhere('candidate.organizationId = :organizationId', {
        organizationId,
      })
      .getOne();

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const applications = await this.applicationRepository
      .createQueryBuilder('application')
      .innerJoin('application.job', 'job')
      .leftJoin('job.client', 'client')
      .select([
        'application.id AS "id"',
        'application.jobId AS "jobId"',
        'job.title AS "jobTitle"',
        'job.reference AS "jobReference"',
        'job.clientId AS "clientId"',
        'client.name AS "clientName"',
        'application.stage AS "stage"',
        'application.rejectionReason AS "rejectionReason"',
        'application.rating AS "rating"',
        'application.shortlisted AS "shortlisted"',
        'application.appliedAt AS "appliedAt"',
        'application.stageChangedAt AS "stageChangedAt"',
      ])
      .where('application.candidateId = :candidateId', { candidateId })
      .andWhere('application.organizationId = :organizationId', {
        organizationId,
      })
      .orderBy('application.appliedAt', 'DESC')
      .getRawMany();

    return { ...candidate, applications };
  }
}
