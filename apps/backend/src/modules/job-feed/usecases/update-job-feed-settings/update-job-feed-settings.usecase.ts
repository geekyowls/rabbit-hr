import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobFeedRepository } from '@db/repositories';
import { generateFeedToken, toSettingsResponse } from '../../job-feed.helpers';
import { UpdateJobFeedSettingsCommand } from './update-job-feed-settings.command';

@Injectable()
export class UpdateJobFeedSettings {
  constructor(
    private readonly jobFeedRepository: JobFeedRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(command: UpdateJobFeedSettingsCommand) {
    const feed =
      (await this.jobFeedRepository.findOne({
        where: { organizationId: command.organizationId },
      })) ??
      this.jobFeedRepository.create({
        organizationId: command.organizationId,
        enabled: false,
        includeClientNames: true,
        token: generateFeedToken(),
      });
    if (command.enabled !== undefined) feed.enabled = command.enabled;
    if (command.includeClientNames !== undefined) {
      feed.includeClientNames = command.includeClientNames;
    }
    if (command.regenerateToken) feed.token = generateFeedToken();
    feed.updatedBy = command.userId;
    const saved = await this.jobFeedRepository.save(feed);
    return toSettingsResponse(this.config, saved);
  }
}
