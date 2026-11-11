import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { CalendarEvent, InterviewExternalRefs } from '@boilerplate/core';
import { InterviewEntity } from '@db/entities';
import {
  ActivityRepository,
  CandidateRepository,
  InterviewRepository,
  JobRepository,
  UserRepository,
} from '@db/repositories';
import {
  CalendarSyncStatus,
  InterviewMeetingProvider,
  InterviewStatus,
} from '@db/enums';
import { IntegrationTokenService } from '@modules/integration/core/integration-token.service';
import {
  INTEGRATION_PROVIDERS,
  IntegrationNotConnectedException,
} from '@modules/integration/core/integration-capabilities.types';
import { recordInterviewActivity } from '@modules/interview/usecases/interview-activity';
import { InterviewCalendarSyncJob } from './interview-calendar-sync.types';

const NON_RETRYABLE_HINTS = ['not configured', 'reconnect', 'invalid_grant'];

export function isRetryableSyncError(error: unknown): boolean {
  if (error instanceof IntegrationNotConnectedException) return false;
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return !NON_RETRYABLE_HINTS.some((hint) => message.includes(hint));
}

const CALENDAR_MEETING: Record<string, InterviewMeetingProvider> = {
  [INTEGRATION_PROVIDERS.GOOGLE_CALENDAR]: InterviewMeetingProvider.GOOGLE_MEET,
  [INTEGRATION_PROVIDERS.MICROSOFT]: InterviewMeetingProvider.TEAMS,
};

@Injectable()
export class InterviewCalendarSyncExecutor {
  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly jobRepository: JobRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly tokens: IntegrationTokenService,
  ) {}

  async run(job: InterviewCalendarSyncJob): Promise<void> {
    if (job.action === 'remove') {
      await this.remove(job.organizationId, job.interviewId, job.refs);
      return;
    }
    await this.upsert(job.organizationId, job.interviewId);
  }

  async markFailed(job: InterviewCalendarSyncJob, error: unknown) {
    const message = (
      error instanceof Error ? error.message : String(error)
    ).slice(0, 1000);
    const interview = await this.interviewRepository.findOne({
      where: { id: job.interviewId, organizationId: job.organizationId },
    });
    if (!interview) return;
    await this.interviewRepository.update(
      { id: interview.id, organizationId: job.organizationId },
      {
        calendarSyncStatus: CalendarSyncStatus.FAILED,
        calendarSyncError: message,
      },
    );
    await recordInterviewActivity(this.activityRepository, {
      interview,
      event: 'calendar_sync_failed',
      title: `Calendar sync failed: ${interview.title}`,
      body: message,
      actorId: interview.organizerId,
      metadata: { action: job.action },
    });
  }

  private async upsert(organizationId: string, interviewId: string) {
    const interview = await this.interviewRepository.findOne({
      where: { id: interviewId, organizationId },
    });
    if (!interview || interview.status === InterviewStatus.CANCELLED) return;
    if (interview.calendarSyncStatus === CalendarSyncStatus.SKIPPED) return;

    const event = await this.buildEvent(interview);

    if (interview.meetingProvider === InterviewMeetingProvider.ZOOM) {
      const zoom = await this.tokens.getValidTokens(
        organizationId,
        INTEGRATION_PROVIDERS.ZOOM,
      );
      const service = this.tokens.calendarService(INTEGRATION_PROVIDERS.ZOOM);
      const result = interview.meetingExternalId
        ? await service.updateCalendarEvent(
            zoom,
            interview.meetingExternalId,
            event,
          )
        : await service.createCalendarEvent(zoom, event);
      interview.meetingExternalId = result.eventId;
      if (result.meetingLink) interview.meetingUrl = result.meetingLink;
    } else if (interview.meetingExternalId) {
      await this.deleteZoomMeeting(organizationId, interview.meetingExternalId);
      interview.meetingExternalId = null;
    }

    if (interview.calendarProvider) {
      const provider = interview.calendarProvider;
      const native = CALENDAR_MEETING[provider] === interview.meetingProvider;
      const calendarEvent: CalendarEvent = {
        ...event,
        withMeetingLink: native,
        meetingLink:
          !native && interview.meetingUrl ? interview.meetingUrl : undefined,
      };
      const credentials = await this.tokens.getValidTokens(
        organizationId,
        provider,
      );
      const service = this.tokens.calendarService(provider);
      const result = interview.externalEventId
        ? await service.updateCalendarEvent(
            credentials,
            interview.externalEventId,
            calendarEvent,
          )
        : await service.createCalendarEvent(credentials, calendarEvent);
      interview.externalEventId = result.eventId;
      if (native && result.meetingLink)
        interview.meetingUrl = result.meetingLink;
    }

    await this.interviewRepository.update(
      { id: interview.id, organizationId },
      {
        meetingUrl: interview.meetingUrl,
        meetingExternalId: interview.meetingExternalId,
        externalEventId: interview.externalEventId,
        calendarSyncStatus: CalendarSyncStatus.SYNCED,
        calendarSyncError: null,
        calendarSyncedAt: new Date(),
      },
    );
  }

  private async remove(
    organizationId: string,
    interviewId: string,
    refs: InterviewExternalRefs,
  ) {
    if (
      refs.meetingProvider === InterviewMeetingProvider.ZOOM &&
      refs.meetingExternalId
    ) {
      await this.deleteZoomMeeting(organizationId, refs.meetingExternalId);
    }
    if (refs.calendarProvider && refs.externalEventId) {
      const credentials = await this.tokens.getValidTokens(
        organizationId,
        refs.calendarProvider,
      );
      await this.tokens
        .calendarService(refs.calendarProvider)
        .deleteCalendarEvent(credentials, refs.externalEventId);
    }
    await this.interviewRepository.update(
      { id: interviewId, organizationId },
      {
        calendarSyncStatus: CalendarSyncStatus.SYNCED,
        calendarSyncError: null,
        calendarSyncedAt: new Date(),
      },
    );
  }

  private async deleteZoomMeeting(organizationId: string, meetingId: string) {
    const zoom = await this.tokens.getValidTokens(
      organizationId,
      INTEGRATION_PROVIDERS.ZOOM,
    );
    await this.tokens
      .calendarService(INTEGRATION_PROVIDERS.ZOOM)
      .deleteCalendarEvent(zoom, meetingId);
  }

  private async buildEvent(interview: InterviewEntity): Promise<CalendarEvent> {
    const [candidate, job, interviewers] = await Promise.all([
      this.candidateRepository.findOne({
        where: {
          id: interview.candidateId,
          organizationId: interview.organizationId,
        },
        select: ['id', 'firstName', 'lastName', 'email'],
      }),
      this.jobRepository.findOne({
        where: {
          id: interview.jobId,
          organizationId: interview.organizationId,
        },
        select: ['id', 'title'],
      }),
      interview.interviewerIds.length > 0
        ? this.userRepository.find({
            where: {
              id: In(interview.interviewerIds),
              organizationId: interview.organizationId,
            },
            select: ['id', 'email'],
          })
        : Promise.resolve([]),
    ]);
    const candidateName = candidate
      ? `${candidate.firstName} ${candidate.lastName}`.trim()
      : 'Candidate';
    const attendees = [
      candidate?.email,
      ...interviewers.map((u) => u.email),
    ].filter((email): email is string => !!email);
    const start = new Date(interview.scheduledAt);
    return {
      summary: job
        ? `${interview.title}: ${candidateName} for ${job.title}`
        : `${interview.title}: ${candidateName}`,
      description: job
        ? `Interview with ${candidateName} for the ${job.title} role`
        : `Interview with ${candidateName}`,
      startTime: start,
      endTime: new Date(start.getTime() + interview.durationMinutes * 60_000),
      timeZone: interview.timezone,
      attendeeEmails: [...new Set(attendees)],
      location: interview.location ?? undefined,
    };
  }
}
