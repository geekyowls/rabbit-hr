import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ActivityRepository, ApplicationRepository } from '@db/repositories';
import { ActivityType, PipelineStageCategory } from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { ApplicationStageMover } from '@shared/services/application-stage-mover.service';
import {
  listPortalApplicationRows,
  stageCategories,
  toPortalApplication,
} from '../portal-query';
import { WithdrawPortalApplicationCommand } from './withdraw-portal-application.command';

const OPEN_CATEGORIES = [
  PipelineStageCategory.APPLIED,
  PipelineStageCategory.SCREENING,
  PipelineStageCategory.INTERVIEW,
  PipelineStageCategory.OFFER,
];

@Injectable()
export class WithdrawPortalApplication {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly pipelineStageService: PipelineStageService,
    private readonly applicationStageMover: ApplicationStageMover,
  ) {}

  async execute(command: WithdrawPortalApplicationCommand) {
    const { organizationId, candidateId, applicationId } = command;
    const [row] = await listPortalApplicationRows(
      this.applicationRepository,
      candidateId,
      organizationId,
      applicationId,
    );
    if (!row) {
      throw new NotFoundException('Application not found');
    }
    const categories = await stageCategories(
      this.pipelineStageService,
      organizationId,
    );
    if (toPortalApplication(row, categories).isClosed) {
      throw new BadRequestException('This application is already closed');
    }

    const reason = command.reason?.trim() || null;
    await this.dataSource.transaction(async (manager) => {
      const moved = await this.applicationStageMover.moveToCategory(manager, {
        organizationId,
        applicationId,
        category: PipelineStageCategory.WITHDRAWN,
        onlyFrom: OPEN_CATEGORIES,
        actorId: null,
        reason: reason ?? 'Withdrawn by the candidate from the portal',
      });
      if (!moved) {
        throw new BadRequestException(
          'This application cannot be withdrawn right now',
        );
      }
      await this.activityRepository.record(
        {
          organizationId,
          candidateId,
          applicationId,
          jobId: row.jobId,
          clientId: row.clientId,
          type: ActivityType.PORTAL,
          title: `Candidate withdrew application for ${row.jobTitle}`,
          body: reason,
          metadata: { source: 'portal', action: 'withdraw' },
          actorId: null,
        },
        manager,
      );
    });

    const [updated] = await listPortalApplicationRows(
      this.applicationRepository,
      candidateId,
      organizationId,
      applicationId,
    );
    return toPortalApplication(
      updated,
      await stageCategories(this.pipelineStageService, organizationId),
    );
  }
}
