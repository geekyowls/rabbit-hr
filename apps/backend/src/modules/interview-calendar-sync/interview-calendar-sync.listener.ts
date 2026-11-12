import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EventName,
  type InterviewCancelledEvent,
  type InterviewRescheduledEvent,
  type InterviewScheduledEvent,
  type InterviewUpdatedEvent,
} from '@boilerplate/core';
import { InterviewRepository } from '@db/repositories';
import { CalendarSyncStatus, InterviewMeetingProvider } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { InterviewCalendarSyncPlanner } from './interview-calendar-sync.planner';

@Injectable()
export class InterviewCalendarSyncListener {
  private readonly logger = new ContextLogger(
    InterviewCalendarSyncListener.name,
  );

  constructor(
    private readonly planner: InterviewCalendarSyncPlanner,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  @OnEvent(EventName.INTERVIEW_SCHEDULED, { async: true })
  async onScheduled(event: InterviewScheduledEvent): Promise<void> {
    await this.upsert(event.organizationId, event.interviewId);
  }

  @OnEvent(EventName.INTERVIEW_RESCHEDULED, { async: true })
  async onRescheduled(event: InterviewRescheduledEvent): Promise<void> {
    await this.upsert(event.organizationId, event.interviewId);
  }

  @OnEvent(EventName.INTERVIEW_UPDATED, { async: true })
  async onUpdated(event: InterviewUpdatedEvent): Promise<void> {
    await this.upsert(event.organizationId, event.interviewId);
  }

  @OnEvent(EventName.INTERVIEW_CANCELLED, { async: true })
  async onCancelled(event: InterviewCancelledEvent): Promise<void> {
    const refs = event.externalRefs;
    const hasRemote =
      !!refs.externalEventId ||
      (refs.meetingProvider === InterviewMeetingProvider.ZOOM &&
        !!refs.meetingExternalId);
    if (!hasRemote) return;
    try {
      await this.planner.enqueueRemoval(
        event.organizationId,
        event.interviewId,
        refs,
      );
    } catch (error) {
      await this.fail(event.organizationId, event.interviewId, error);
    }
  }

  private async upsert(
    organizationId: string,
    interviewId: string,
  ): Promise<void> {
    const interview = await this.interviewRepository.findOne({
      where: { id: interviewId, organizationId },
      select: ['id', 'calendarSyncStatus'],
    });
    if (interview?.calendarSyncStatus !== CalendarSyncStatus.PENDING) return;
    try {
      await this.planner.enqueueUpsert(organizationId, interviewId);
    } catch (error) {
      await this.fail(organizationId, interviewId, error);
    }
  }

  private async fail(
    organizationId: string,
    interviewId: string,
    error: unknown,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Interview calendar sync not queued: ${message}`);
    await this.interviewRepository.update(
      { id: interviewId, organizationId },
      {
        calendarSyncStatus: CalendarSyncStatus.FAILED,
        calendarSyncError:
          `Calendar sync could not be queued: ${message}`.slice(0, 1000),
      },
    );
  }
}
