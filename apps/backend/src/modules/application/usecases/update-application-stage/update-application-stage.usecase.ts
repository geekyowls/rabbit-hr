import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApplicationRepository, ActivityRepository } from '@db/repositories';
import { ApplicationEntity } from '@db/entities';
import { ActivityType, ApplicationStage } from '@db/enums';
import { GetApplication } from '../get-application/get-application.usecase';
import { UpdateApplicationStageCommand } from './update-application-stage.command';

const STAGE_LABELS: Record<ApplicationStage, string> = {
  [ApplicationStage.APPLIED]: 'Applied',
  [ApplicationStage.SCREENING]: 'Screening',
  [ApplicationStage.INTERVIEW]: 'Interview',
  [ApplicationStage.OFFER]: 'Offer',
  [ApplicationStage.PLACED]: 'Placed',
  [ApplicationStage.REJECTED]: 'Rejected',
  [ApplicationStage.WITHDRAWN]: 'Withdrawn',
};

@Injectable()
export class UpdateApplicationStage {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getApplication: GetApplication,
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

    const previous = application.stage;
    const rejectionReason =
      command.stage === ApplicationStage.REJECTED
        ? (command.rejectionReason ?? null)
        : null;

    if (
      previous !== command.stage ||
      rejectionReason !== application.rejectionReason
    ) {
      await this.dataSource.transaction(async (manager) => {
        await manager.update(
          ApplicationEntity,
          { id: application.id },
          {
            stage: command.stage,
            rejectionReason,
            ...(previous !== command.stage && { stageChangedAt: new Date() }),
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
            title: `Moved from ${STAGE_LABELS[previous]} to ${STAGE_LABELS[command.stage]}`,
            body: rejectionReason,
            metadata: {
              from: previous,
              to: command.stage,
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
