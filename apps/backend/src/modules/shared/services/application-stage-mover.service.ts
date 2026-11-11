import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApplicationEntity } from '@db/entities';
import { ActivityRepository } from '@db/repositories';
import { ActivityType, PipelineStageCategory } from '@db/enums';
import { PipelineStageService } from './pipeline-stage.service';

export interface MoveToCategoryOptions {
  organizationId: string;
  applicationId: string;
  category: PipelineStageCategory;
  onlyFrom: PipelineStageCategory[];
  actorId: string | null;
  reason?: string;
}

@Injectable()
export class ApplicationStageMover {
  constructor(
    private readonly pipelineStageService: PipelineStageService,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async moveToCategory(
    manager: EntityManager,
    options: MoveToCategoryOptions,
  ): Promise<boolean> {
    const application = await manager.getRepository(ApplicationEntity).findOne({
      where: {
        id: options.applicationId,
        organizationId: options.organizationId,
      },
      relations: { job: true },
    });
    if (!application) return false;

    const stages = await this.pipelineStageService.getStages(
      options.organizationId,
      { activeOnly: true },
    );
    const current = stages.find((s) => s.key === application.stage);
    if (current && !options.onlyFrom.includes(current.category)) return false;
    const target = stages.find((s) => s.category === options.category);
    if (!target || target.key === application.stage) return false;

    await manager.update(
      ApplicationEntity,
      { id: application.id },
      { stage: target.key, rejectionReason: null, stageChangedAt: new Date() },
    );
    await this.activityRepository.record(
      {
        organizationId: options.organizationId,
        candidateId: application.candidateId,
        applicationId: application.id,
        jobId: application.jobId,
        clientId: application.job.clientId,
        type: ActivityType.STAGE_CHANGE,
        title: `Moved from ${current?.name ?? application.stage} to ${target.name}`,
        body: options.reason ?? null,
        metadata: {
          from: application.stage,
          to: target.key,
          toCategory: target.category,
          jobTitle: application.job.title,
        },
        actorId: options.actorId,
      },
      manager,
    );
    return true;
  }
}
