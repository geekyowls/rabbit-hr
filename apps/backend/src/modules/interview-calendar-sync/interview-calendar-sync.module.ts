import { Module } from '@nestjs/common';
import { InterviewCalendarSyncPlanner } from './interview-calendar-sync.planner';
import { InterviewCalendarSyncListener } from './interview-calendar-sync.listener';

@Module({
  providers: [InterviewCalendarSyncPlanner, InterviewCalendarSyncListener],
  exports: [InterviewCalendarSyncPlanner],
})
export class InterviewCalendarSyncModule {}
