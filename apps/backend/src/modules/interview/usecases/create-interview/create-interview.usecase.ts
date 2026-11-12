import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { EventName, type InterviewScheduledEvent } from '@boilerplate/core';
import { ApplicationEntity, InterviewEntity } from '@db/entities';
import { ActivityRepository, UserRepository } from '@db/repositories';
import { InterviewStatus, PipelineStageCategory } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { ApplicationStageMover } from '@shared/services/application-stage-mover.service';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { InterviewCalendarSyncPlanner } from '@modules/interview-calendar-sync/interview-calendar-sync.planner';
import { assertInterviewers } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';
import {
  InterviewInviteService,
  interviewTypeLabel,
} from '../interview-invite.service';
import { GetInterview } from '../get-interview/get-interview.usecase';
import { CreateInterviewCommand } from './create-interview.command';

const DEFAULT_DURATION_MINUTES = 60;

export type InterviewSource = InterviewScheduledEvent['source'];

@Injectable()
export class CreateInterview {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly applicationStageMover: ApplicationStageMover,
    private readonly interviewInviteService: InterviewInviteService,
    private readonly getInterview: GetInterview,
    private readonly syncPlanner: InterviewCalendarSyncPlanner,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: CreateInterviewCommand) {
    const interview = await this.dataSource.transaction((manager) =>
      this.persist(manager, command),
    );
    return this.finalize(interview, command);
  }

  async persist(
    manager: EntityManager,
    command: CreateInterviewCommand,
  ): Promise<InterviewEntity> {
    const { organizationId, userId, payload } = command;
    const application = await manager.getRepository(ApplicationEntity).findOne({
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
    const sync = await this.syncPlanner.plan(organizationId, {
      autoMeetingLink: payload.autoMeetingLink,
      meetingProvider: payload.meetingProvider,
      meetingUrl: payload.meetingUrl ?? null,
    });

    const repo = manager.getRepository(InterviewEntity);
    const saved = await repo.save(
      repo.create({
        organizationId,
        applicationId: application.id,
        candidateId: application.candidateId,
        jobId: application.jobId,
        title: payload.title ?? `${interviewTypeLabel(payload.type)} interview`,
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
        ...sync,
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
  }

  async finalize(
    interview: InterviewEntity,
    command: CreateInterviewCommand,
    source: InterviewSource = 'manual',
  ) {
    const { organizationId, userId, payload } = command;
    this.eventEmitter.emit<InterviewScheduledEvent>({
      eventName: EventName.INTERVIEW_SCHEDULED,
      timestamp: new Date(),
      organizationId,
      triggeredBy: userId,
      interviewId: interview.id,
      applicationId: interview.applicationId,
      scheduledAt: interview.scheduledAt,
      source,
    });
    if (payload.notifyCandidate) {
      this.interviewInviteService.notifyInBackground(interview, userId);
    }
    return this.getInterview.execute(interview.id, organizationId);
  }
}
