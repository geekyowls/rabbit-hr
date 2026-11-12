import { BaseEvent } from './base.event';
import { EventName } from './event-names';

export interface InterviewExternalRefs {
  meetingProvider: string | null;
  meetingExternalId: string | null;
  calendarProvider: string | null;
  externalEventId: string | null;
}

export interface InterviewScheduledEvent extends BaseEvent {
  eventName: EventName.INTERVIEW_SCHEDULED;
  organizationId: string;
  interviewId: string;
  applicationId: string;
  scheduledAt: Date;
  source: 'manual' | 'booking_link';
}

export interface InterviewRescheduledEvent extends BaseEvent {
  eventName: EventName.INTERVIEW_RESCHEDULED;
  organizationId: string;
  interviewId: string;
  applicationId: string;
  scheduledAt: Date;
  previousScheduledAt: Date;
}

export interface InterviewUpdatedEvent extends BaseEvent {
  eventName: EventName.INTERVIEW_UPDATED;
  organizationId: string;
  interviewId: string;
  applicationId: string;
}

export interface InterviewCancelledEvent extends BaseEvent {
  eventName: EventName.INTERVIEW_CANCELLED;
  organizationId: string;
  interviewId: string;
  applicationId: string;
  deleted: boolean;
  reason: string | null;
  externalRefs: InterviewExternalRefs;
}

export type InterviewEvent =
  | InterviewScheduledEvent
  | InterviewRescheduledEvent
  | InterviewUpdatedEvent
  | InterviewCancelledEvent;
