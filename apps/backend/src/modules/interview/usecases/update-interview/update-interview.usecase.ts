import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EventName,
  type InterviewRescheduledEvent,
  type InterviewUpdatedEvent,
} from '@boilerplate/core';
import {
  ActivityRepository,
  InterviewRepository,
  UserRepository,
} from '@db/repositories';
import { InterviewStatus } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { InterviewCalendarSyncPlanner } from '@modules/interview-calendar-sync/interview-calendar-sync.planner';
import { assertInterviewers, loadInterviewEntity } from '../interview-query';
import { recordInterviewActivity } from '../interview-activity';
import { InterviewInviteService } from '../interview-invite.service';
import { GetInterview } from '../get-interview/get-interview.usecase';
import { UpdateInterviewCommand } from './update-interview.command';

@Injectable()
export class UpdateInterview {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly interviewInviteService: InterviewInviteService,
    private readonly getInterview: GetInterview,
    private readonly syncPlanner: InterviewCalendarSyncPlanner,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: UpdateInterviewCommand) {
    const { organizationId, userId } = command;
    const interview = await loadInterviewEntity(
      this.interviewRepository,
      command.interviewId,
      organizationId,
    );
    if (interview.status === InterviewStatus.CANCELLED) {
      throw new BadRequestException('Cancelled interviews cannot be updated');
    }

    const {
      notifyCandidate,
      scheduledAt,
      autoMeetingLink,
      meetingProvider,
      ...changes
    } = pickDefined(command.payload);
    if (changes.interviewerIds) {
      await assertInterviewers(
        this.userRepository,
        organizationId,
        changes.interviewerIds,
      );
    }

    const previousAt = new Date(interview.scheduledAt).getTime();
    const nextAt = scheduledAt ? new Date(scheduledAt) : null;
    const rescheduled = !!nextAt && nextAt.getTime() !== previousAt;

    const sync = await this.syncPlanner.plan(
      organizationId,
      { autoMeetingLink, meetingProvider, meetingUrl: changes.meetingUrl },
      interview,
    );
    Object.assign(
      interview,
      changes,
      nextAt ? { scheduledAt: nextAt } : {},
      sync,
    );
    if (rescheduled && interview.status !== InterviewStatus.SCHEDULED) {
      interview.status = InterviewStatus.SCHEDULED;
    }
    const saved = await this.interviewRepository.save(interview);

    await recordInterviewActivity(this.activityRepository, {
      interview: saved,
      event: rescheduled ? 'rescheduled' : 'updated',
      title: rescheduled
        ? `Interview rescheduled: ${saved.title}`
        : `Interview updated: ${saved.title}`,
      actorId: userId,
      metadata: rescheduled
        ? { previousScheduledAt: new Date(previousAt).toISOString() }
        : undefined,
    });

    if (rescheduled) {
      this.eventEmitter.emit<InterviewRescheduledEvent>({
        eventName: EventName.INTERVIEW_RESCHEDULED,
        timestamp: new Date(),
        organizationId,
        triggeredBy: userId,
        interviewId: saved.id,
        applicationId: saved.applicationId,
        scheduledAt: saved.scheduledAt,
        previousScheduledAt: new Date(previousAt),
      });
    } else {
      this.eventEmitter.emit<InterviewUpdatedEvent>({
        eventName: EventName.INTERVIEW_UPDATED,
        timestamp: new Date(),
        organizationId,
        triggeredBy: userId,
        interviewId: saved.id,
        applicationId: saved.applicationId,
      });
    }

    if (notifyCandidate) {
      this.interviewInviteService.notifyInBackground(
        saved,
        userId,
        rescheduled,
      );
    }

    return this.getInterview.execute(saved.id, organizationId);
  }
}
