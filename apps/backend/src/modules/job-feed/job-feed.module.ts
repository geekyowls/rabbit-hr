import { Module } from '@nestjs/common';
import { JobFeedController } from './job-feed.controller';
import { GetJobFeedSettings } from './usecases/get-job-feed-settings/get-job-feed-settings.usecase';
import { UpdateJobFeedSettings } from './usecases/update-job-feed-settings/update-job-feed-settings.usecase';
import { RenderJobFeed } from './usecases/render-job-feed/render-job-feed.usecase';

@Module({
  controllers: [JobFeedController],
  providers: [GetJobFeedSettings, UpdateJobFeedSettings, RenderJobFeed],
})
export class JobFeedModule {}
