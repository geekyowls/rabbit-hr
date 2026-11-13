import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import {
  CandidateEntity,
  ClientEntity,
  JobEntity,
  OrganizationEntity,
} from '@db/entities';
import { OrganizationRepository } from '@db/repositories';
import { SampleDataResultDto } from '../../dtos/onboarding.dto';
import { OnboardingCache } from '../../onboarding-cache.service';
import { OnboardingCommand } from '../onboarding.command';

@Injectable()
export class RemoveSampleData {
  constructor(
    private readonly dataSource: DataSource,
    private readonly organizationRepository: OrganizationRepository,
    private readonly cache: OnboardingCache,
  ) {}

  async execute(command: OnboardingCommand): Promise<SampleDataResultDto> {
    const { organizationId } = command;
    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: organizationId },
      select: ['id', 'metadata'],
    });
    const sample = organization.metadata?.sampleData;
    if (!sample) {
      throw new NotFoundException('There is no sample data to remove');
    }
    const { sampleData: _removed, ...metadata } = organization.metadata ?? {};

    const result = await this.dataSource.transaction(async (manager) => {
      const remove = async (
        entity: typeof CandidateEntity | typeof JobEntity | typeof ClientEntity,
        ids: string[],
      ) =>
        ids.length === 0
          ? 0
          : ((await manager.delete(entity, { organizationId, id: In(ids) }))
              .affected ?? 0);
      const candidates = await remove(CandidateEntity, sample.candidateIds);
      const jobs = await remove(JobEntity, sample.jobIds);
      const clients = await remove(ClientEntity, sample.clientIds);
      await manager.update(OrganizationEntity, organizationId, { metadata });
      return { clients, jobs, candidates };
    });

    await this.cache.invalidate(organizationId);
    return result;
  }
}
