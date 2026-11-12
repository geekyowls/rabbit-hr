import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApplicationRepository, ActivityRepository } from '@db/repositories';
import { ApplicationEntity } from '@db/entities';
import { ActivityType, PipelineStageCategory } from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { GetApplication } from '../get-application/get-application.usecase';
import { UpdateApplicationStageCommand } from './update-application-stage.command';

@Injectable()
export class UpdateApplicationStage {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getApplication: GetApplication,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: UpdateApplicationStageCommand) {
    const application = await this.applicationRepository.findOne({
      where: {
        id: command.applicationId,
        organizationId: command.organizationId,
      },
      relations: { job: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const stages = await this.pipelineStageService.getStages(
      command.organizationId,
    );
    const target = stages.find((s) => s.key === command.stage && s.isActive);
    if (!target) {
      throw new BadRequestException(`Unknown pipeline stage: ${command.stage}`);
    }
    const isRejection = target.category === PipelineStageCategory.REJECTED;
    const reason = command.rejectionReason?.trim();
    if (isRejection && !reason) {
      throw new BadRequestException(
        'A rejection reason is required for this stage',
      );
    }

    const previous = application.stage;
    const previousName =
      stages.find((s) => s.key === previous)?.name ?? previous;
    const rejectionReason = isRejection ? reason! : null;

    if (
      previous !== target.key ||
      rejectionReason !== application.rejectionReason
    ) {
      await this.dataSource.transaction(async (manager) => {
        await manager.update(
          ApplicationEntity,
          { id: application.id },
          {
            stage: target.key,
            rejectionReason,
            ...(previous !== target.key && { stageChangedAt: new Date() }),
          },
        );
        await this.activityRepository.record(
          {
            organizationId: command.organizationId,
            candidateId: application.candidateId,
            applicationId: application.id,
            jobId: application.jobId,
            clientId: application.job.clientId,
            type: ActivityType.STAGE_CHANGE,
            title: `Moved from ${previousName} to ${target.name}`,
            body: rejectionReason,
            metadata: {
              from: previous,
              to: target.key,
              toCategory: target.category,
              jobTitle: application.job.title,
            },
            actorId: command.userId,
          },
          manager,
        );
      });
    }

    return this.getApplication.execute(application.id, command.organizationId);
  }
}
