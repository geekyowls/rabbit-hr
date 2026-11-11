import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InterviewExternalRefs } from '@boilerplate/core';
import { InterviewEntity } from '@db/entities';
import { CalendarSyncStatus, InterviewMeetingProvider } from '@db/enums';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import { IntegrationCapabilitiesService } from '@modules/integration/core/integration-capabilities.service';
import {
  CalendarProvider,
  INTEGRATION_PROVIDERS,
  OrganizationCapabilities,
} from '@modules/integration/core/integration-capabilities.types';
import {
  INTERVIEW_CALENDAR_SYNC_JOB,
  InterviewCalendarSyncJob,
} from './interview-calendar-sync.types';

export interface InterviewSyncRequest {
  autoMeetingLink?: boolean;
  meetingProvider?: InterviewMeetingProvider;
  meetingUrl?: string | null;
}

export type InterviewSyncFields = Pick<
  InterviewEntity,
  | 'meetingProvider'
  | 'calendarProvider'
  | 'calendarSyncStatus'
  | 'calendarSyncError'
>;

const AUTO_PROVIDERS = [
  InterviewMeetingProvider.GOOGLE_MEET,
  InterviewMeetingProvider.ZOOM,
  InterviewMeetingProvider.TEAMS,
];

const MEETING_LABELS: Record<string, string> = {
  [InterviewMeetingProvider.GOOGLE_MEET]: 'Google Meet',
  [InterviewMeetingProvider.ZOOM]: 'Zoom',
  [InterviewMeetingProvider.TEAMS]: 'Microsoft Teams',
};

function meetingConnected(
  caps: OrganizationCapabilities,
  provider: InterviewMeetingProvider,
): boolean {
  switch (provider) {
    case InterviewMeetingProvider.GOOGLE_MEET:
      return caps.meetings.googleMeet;
    case InterviewMeetingProvider.ZOOM:
      return caps.meetings.zoom;
    case InterviewMeetingProvider.TEAMS:
      return caps.meetings.teams;
    default:
      return false;
  }
}

function pickCalendar(
  caps: OrganizationCapabilities,
  meetingProvider: InterviewMeetingProvider,
): CalendarProvider | null {
  if (meetingProvider === InterviewMeetingProvider.GOOGLE_MEET) {
    return INTEGRATION_PROVIDERS.GOOGLE_CALENDAR;
  }
  if (meetingProvider === InterviewMeetingProvider.TEAMS) {
    return INTEGRATION_PROVIDERS.MICROSOFT;
  }
  if (caps.calendar.google) return INTEGRATION_PROVIDERS.GOOGLE_CALENDAR;
  if (caps.calendar.microsoft) return INTEGRATION_PROVIDERS.MICROSOFT;
  return null;
}

export function planInterviewSync(
  caps: OrganizationCapabilities,
  request: InterviewSyncRequest,
  existing?: Pick<
    InterviewEntity,
    'meetingProvider' | 'calendarProvider' | 'externalEventId' | 'meetingUrl'
  >,
): InterviewSyncFields {
  const meetingUrl =
    request.meetingUrl !== undefined
      ? request.meetingUrl
      : (existing?.meetingUrl ?? null);
  let meetingProvider =
    existing?.meetingProvider ?? InterviewMeetingProvider.NONE;
  let skipReason: string | null = null;

  const requested = request.meetingProvider;
  if (
    request.autoMeetingLink &&
    requested &&
    AUTO_PROVIDERS.includes(requested)
  ) {
    if (meetingConnected(caps, requested)) {
      meetingProvider = requested;
    } else {
      skipReason = `${MEETING_LABELS[requested]} is not connected`;
      meetingProvider = meetingUrl
        ? InterviewMeetingProvider.MANUAL
        : InterviewMeetingProvider.NONE;
    }
  } else if (request.meetingUrl !== undefined || requested !== undefined) {
    meetingProvider = meetingUrl
      ? InterviewMeetingProvider.MANUAL
      : InterviewMeetingProvider.NONE;
  }

  const calendarProvider =
    existing?.externalEventId && existing.calendarProvider
      ? existing.calendarProvider
      : pickCalendar(caps, meetingProvider);
  const needsRemote =
    !!calendarProvider || meetingProvider === InterviewMeetingProvider.ZOOM;

  return {
    meetingProvider,
    calendarProvider,
    calendarSyncStatus: needsRemote
      ? CalendarSyncStatus.PENDING
      : CalendarSyncStatus.SKIPPED,
    calendarSyncError: needsRemote
      ? null
      : (skipReason ?? 'No calendar or meeting integration connected'),
  };
}

@Injectable()
export class InterviewCalendarSyncPlanner {
  constructor(
    private readonly capabilities: IntegrationCapabilitiesService,
    @InjectQueue(QUEUE_NAMES.INTERVIEW_CALENDAR_SYNC)
    private readonly queue: Queue<InterviewCalendarSyncJob>,
  ) {}

  async plan(
    organizationId: string,
    request: InterviewSyncRequest,
    existing?: Parameters<typeof planInterviewSync>[2],
  ): Promise<InterviewSyncFields> {
    const caps =
      await this.capabilities.getOrganizationCapabilities(organizationId);
    return planInterviewSync(caps, request, existing);
  }

  async enqueueUpsert(organizationId: string, interviewId: string) {
    await this.queue.add(INTERVIEW_CALENDAR_SYNC_JOB, {
      action: 'upsert',
      organizationId,
      interviewId,
    });
  }

  async enqueueRemoval(
    organizationId: string,
    interviewId: string,
    refs: InterviewExternalRefs,
  ) {
    await this.queue.add(INTERVIEW_CALENDAR_SYNC_JOB, {
      action: 'remove',
      organizationId,
      interviewId,
      refs,
    });
  }
}
