import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InterviewEntity } from '@db/entities';
import {
  ActivityRepository,
  ApplicationRepository,
  UserRepository,
} from '@db/repositories';
import { InterviewStatus, PipelineStageCategory } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { ApplicationStageMover } from '@shared/services/application-stage-mover.service';
import { assertInterviewers } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';
import {
  InterviewInviteService,
  interviewTypeLabel,
} from '../interview-invite.service';
import { GetInterview } from '../get-interview/get-interview.usecase';
import { CreateInterviewCommand } from './create-interview.command';

const DEFAULT_DURATION_MINUTES = 60;

@Injectable()
export class CreateInterview {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationRepository: ApplicationRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly applicationStageMover: ApplicationStageMover,
    private readonly interviewInviteService: InterviewInviteService,
    private readonly getInterview: GetInterview,
  ) {}

  async execute(command: CreateInterviewCommand) {
    const { organizationId, userId, payload } = command;
    const application = await this.applicationRepository.findOne({
      where: { id: payload.applicationId, organizationId },
      select: ['id', 'candidateId', 'jobId'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    await assertInterviewers(
      this.userRepository,
      organizationId,
      payload.interviewerIds,
    );
    const timezone =
      payload.timezone ??
      (await this.atsSettingsService.get(organizationId)).timezone;

    const interview = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(InterviewEntity);
      const saved = await repo.save(
        repo.create({
          organizationId,
          applicationId: application.id,
          candidateId: application.candidateId,
          jobId: application.jobId,
          title:
            payload.title ?? `${interviewTypeLabel(payload.type)} interview`,
          type: payload.type,
          scheduledAt: new Date(payload.scheduledAt),
          durationMinutes: payload.durationMinutes ?? DEFAULT_DURATION_MINUTES,
          timezone,
          location: payload.location ?? null,
          meetingUrl: payload.meetingUrl ?? null,
          interviewerIds: payload.interviewerIds,
          organizerId: userId,
          status: InterviewStatus.SCHEDULED,
          notes: payload.notes ?? null,
        }),
      );
      await recordInterviewActivity(
        this.activityRepository,
        {
          interview: saved,
          event: 'scheduled',
          title: `Interview scheduled: ${saved.title}`,
          actorId: userId,
          metadata: { type: saved.type },
        },
        manager,
      );
      if (payload.moveToInterviewStage ?? true) {
        await this.applicationStageMover.moveToCategory(manager, {
          organizationId,
          applicationId: application.id,
          category: PipelineStageCategory.INTERVIEW,
          onlyFrom: [
            PipelineStageCategory.APPLIED,
            PipelineStageCategory.SCREENING,
          ],
          actorId: userId,
        });
      }
      return saved;
    });

    if (payload.notifyCandidate) {
      this.interviewInviteService.notifyInBackground(interview, userId);
    }

    return this.getInterview.execute(interview.id, organizationId);
  }
}
