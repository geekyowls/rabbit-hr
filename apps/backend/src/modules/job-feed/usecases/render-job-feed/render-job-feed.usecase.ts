import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveAtsSettings } from '@db/entities';
import {
  JobFeedRepository,
  JobRepository,
  OrganizationRepository,
} from '@db/repositories';
import { OrganizationStatus } from '@db/enums';
import {
  CAREERS_JOB_SELECT,
  buildOpenJobsQuery,
} from '@modules/careers/usecases/careers-query';
import { frontendUrl } from '../../job-feed.helpers';
import { buildIndeedFeed, buildLinkedinFeed, FeedJob } from '../../feed-xml';
import { RenderJobFeedCommand } from './render-job-feed.command';

const MAX_FEED_JOBS = 1000;

@Injectable()
export class RenderJobFeed {
  constructor(
    private readonly jobFeedRepository: JobFeedRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly jobRepository: JobRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(command: RenderJobFeedCommand): Promise<string> {
    const feed = await this.jobFeedRepository.findOne({
      where: { token: command.token, enabled: true },
    });
    if (!feed) throw new NotFoundException('Job feed not found');
    const organization = await this.organizationRepository.findOne({
      where: { id: feed.organizationId, status: OrganizationStatus.ACTIVE },
      select: ['id', 'name', 'slug', 'atsSettings'],
    });
    if (!organization) throw new NotFoundException('Job feed not found');

    const query = buildOpenJobsQuery(this.jobRepository, organization.id, [
      ...CAREERS_JOB_SELECT,
      'job.description',
      'job.requirements',
      'job.createdAt',
    ]);
    if (feed.includeClientNames) {
      query
        .leftJoin('job.client', 'client')
        .addSelect(['client.id', 'client.name']);
    }
    const jobs = (await query
      .orderBy('job.publishedAt', 'DESC', 'NULLS LAST')
      .take(MAX_FEED_JOBS)
      .getMany()) as FeedJob[];

    void this.jobFeedRepository.update(feed.id, { lastAccessedAt: new Date() });

    const settings = resolveAtsSettings(organization.atsSettings);
    const ctx = {
      organizationName: organization.name,
      organizationSlug: organization.slug,
      country: settings.country,
      locale: settings.locale,
      includeClientNames: feed.includeClientNames,
      frontendUrl: frontendUrl(this.config),
    };
    return command.format === 'linkedin'
      ? buildLinkedinFeed(ctx, jobs)
      : buildIndeedFeed(ctx, jobs);
  }
}
