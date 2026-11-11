import { InterviewExternalRefs } from '@boilerplate/core';

export type InterviewCalendarSyncJob =
  | { action: 'upsert'; organizationId: string; interviewId: string }
  | {
      action: 'remove';
      organizationId: string;
      interviewId: string;
      refs: InterviewExternalRefs;
    };

export const INTERVIEW_CALENDAR_SYNC_JOB = 'sync';
