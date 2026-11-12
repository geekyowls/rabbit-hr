import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobFeedRepository } from '@db/repositories';
import { toSettingsResponse } from '../../job-feed.helpers';
import { GetJobFeedSettingsCommand } from './get-job-feed-settings.command';

@Injectable()
export class GetJobFeedSettings {
  constructor(
    private readonly jobFeedRepository: JobFeedRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(command: GetJobFeedSettingsCommand) {
    const feed = await this.jobFeedRepository.findOne({
      where: { organizationId: command.organizationId },
    });
    return toSettingsResponse(this.config, feed);
  }
}
