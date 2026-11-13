import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { SAMPLE_DATA_TAG } from '@boilerplate/core';
import {
  ApplicationEntity,
  CandidateEntity,
  ClientEntity,
  JobEntity,
  OrganizationEntity,
} from '@db/entities';
import {
  CandidateRepository,
  JobRepository,
  OrganizationRepository,
} from '@db/repositories';
import { JobStatus } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { SampleDataResultDto } from '../../dtos/onboarding.dto';
import { OnboardingCache } from '../../onboarding-cache.service';
import { OnboardingCommand } from '../onboarding.command';
import {
  SAMPLE_CANDIDATES,
  SAMPLE_CLIENTS,
  SAMPLE_SUFFIX,
} from './sample-data';

function offsetReference(reference: string, offset: number): string {
  return reference.replace(/\d+$/, (digits) =>
    String(Number(digits) + offset).padStart(digits.length, '0'),
  );
}

@Injectable()
export class AddSampleData {
  constructor(
    private readonly dataSource: DataSource,
    private readonly organizationRepository: OrganizationRepository,
    private readonly jobRepository: JobRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly pipelineStageService: PipelineStageService,
    private readonly cache: OnboardingCache,
  ) {}

  async execute(command: OnboardingCommand): Promise<SampleDataResultDto> {
    const { organizationId, userId } = command;
    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: organizationId },
      select: ['id', 'metadata'],
    });
    if (organization.metadata?.sampleData) {
      throw new ConflictException('Sample data is already in your workspace');
    }

    const [settings, stages, firstReference, taken] = await Promise.all([
      this.atsSettingsService.get(organizationId),
      this.pipelineStageService.getStages(organizationId, { activeOnly: true }),
      this.jobRepository.nextReference(organizationId),
      this.candidateRepository.find({
        where: {
          organizationId,
          email: In(SAMPLE_CANDIDATES.map((c) => c.email)),
        },
        select: ['id', 'email'],
      }),
    ]);
    const openStages = stages.filter(
      (stage) => !this.pipelineStageService.isClosedCategory(stage.category),
    );
    const takenEmails = new Set(taken.map((c) => c.email));

    const result = await this.dataSource.transaction(async (manager) => {
      const clients = await manager.save(
        SAMPLE_CLIENTS.map((client) =>
          manager.create(ClientEntity, {
            organizationId,
            name: `${client.name}${SAMPLE_SUFFIX}`,
            industry: client.industry,
            email: client.email,
            website: client.website,
            ownerId: userId,
            notes: 'Sample data. Remove it from the dashboard checklist',
          }),
        ),
      );

      const jobs = await manager.save(
        SAMPLE_CLIENTS.flatMap((client, clientIndex) =>
          client.jobs.map((job) => ({
            job,
            clientId: clients[clientIndex].id,
          })),
        ).map(({ job, clientId }, index) =>
          manager.create(JobEntity, {
            organizationId,
            clientId,
            reference: offsetReference(firstReference, index),
            title: `${job.title}${SAMPLE_SUFFIX}`,
            description: job.description,
            location: job.location,
            employmentType: job.employmentType,
            workMode: job.workMode,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: settings.defaultCurrency,
            skills: job.skills,
            status: JobStatus.DRAFT,
            ownerId: userId,
            recruiterId: userId,
          }),
        ),
      );

      const sampleCandidates = SAMPLE_CANDIDATES.filter(
        (candidate) => !takenEmails.has(candidate.email),
      );
      const candidates = await manager.save(
        sampleCandidates.map((candidate) =>
          manager.create(CandidateEntity, {
            organizationId,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            currentTitle: candidate.currentTitle,
            location: candidate.location,
            skills: candidate.skills,
            tags: [SAMPLE_DATA_TAG],
            source: candidate.source,
            rightToWork: candidate.rightToWork,
            ownerId: userId,
          }),
        ),
      );

      if (openStages.length > 0) {
        await manager.save(
          sampleCandidates.map((candidate, index) =>
            manager.create(ApplicationEntity, {
              organizationId,
              candidateId: candidates[index].id,
              jobId: jobs[candidate.jobIndex].id,
              stage:
                openStages[
                  Math.min(candidate.stageIndex, openStages.length - 1)
                ].key,
              source: candidate.source,
              ownerId: userId,
            }),
          ),
        );
      }

      await manager.update(OrganizationEntity, organizationId, {
        metadata: {
          ...(organization.metadata ?? {}),
          sampleData: {
            createdAt: new Date().toISOString(),
            clientIds: clients.map((c) => c.id),
            jobIds: jobs.map((j) => j.id),
            candidateIds: candidates.map((c) => c.id),
          },
        },
      });

      return {
        clients: clients.length,
        jobs: jobs.length,
        candidates: candidates.length,
      };
    });

    await this.cache.invalidate(organizationId);
    return result;
  }
}
