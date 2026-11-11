import { Module } from '@nestjs/common';
import { InterviewCalendarSyncExecutor } from './interview-calendar-sync.executor';
import { InterviewCalendarSyncProcessor } from './interview-calendar-sync.processor';

@Module({
  providers: [InterviewCalendarSyncExecutor, InterviewCalendarSyncProcessor],
})
export class InterviewCalendarSyncWorkerModule {}
