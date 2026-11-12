import { Body, Controller, Get, Param, Put, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PERMISSIONS_ENUM, PlanFeature } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { RequirePlanFeature } from '@shared/decorators/require-plan-feature.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { UpdateJobFeedSettingsDto } from './dtos/job-feed.dto';
import { GetJobFeedSettings } from './usecases/get-job-feed-settings/get-job-feed-settings.usecase';
import { GetJobFeedSettingsCommand } from './usecases/get-job-feed-settings/get-job-feed-settings.command';
import { UpdateJobFeedSettings } from './usecases/update-job-feed-settings/update-job-feed-settings.usecase';
import { UpdateJobFeedSettingsCommand } from './usecases/update-job-feed-settings/update-job-feed-settings.command';
import { RenderJobFeed } from './usecases/render-job-feed/render-job-feed.usecase';
import { RenderJobFeedCommand } from './usecases/render-job-feed/render-job-feed.command';
import type { JobFeedFormat } from './job-feed.helpers';

const FEED_LIMITS = {
  short: { limit: 5, ttl: 1000 },
  medium: { limit: 20, ttl: 10000 },
  long: { limit: 60, ttl: 60000 },
};

@ApiTags('Job Feed')
@ApiCommonResponses()
@Controller()
export class JobFeedController {
  constructor(
    private readonly getSettings: GetJobFeedSettings,
    private readonly updateSettings: UpdateJobFeedSettings,
    private readonly renderJobFeed: RenderJobFeed,
  ) {}

  @Get('job-feed/settings')
  @RequirePermissions(PERMISSIONS_ENUM.JOB_FEED_MANAGE)
  @RequirePlanFeature(PlanFeature.JOB_FEED)
  @ApiOperation({ summary: 'Job board feed settings and feed URLs' })
  async settings(@UserSession() user: UserSessionData) {
    return this.getSettings.execute(
      GetJobFeedSettingsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Put('job-feed/settings')
  @RequirePermissions(PERMISSIONS_ENUM.JOB_FEED_MANAGE)
  @RequirePlanFeature(PlanFeature.JOB_FEED)
  @ApiOperation({ summary: 'Enable, disable or rotate the job board feed' })
  async update(
    @UserSession() user: UserSessionData,
    @Body() dto: UpdateJobFeedSettingsDto,
  ) {
    return this.updateSettings.execute(
      UpdateJobFeedSettingsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        enabled: dto.enabled,
        includeClientNames: dto.includeClientNames,
        regenerateToken: dto.regenerateToken,
      }),
    );
  }

  @Get('public/job-feed/:token.xml')
  @Throttle(FEED_LIMITS)
  @ApiOperation({ summary: 'Indeed compatible XML feed of published jobs' })
  async indeed(@Param('token') token: string, @Res() res: Response) {
    await this.send(res, token, 'indeed');
  }

  @Get('public/job-feed/:token/linkedin.xml')
  @Throttle(FEED_LIMITS)
  @ApiOperation({ summary: 'LinkedIn compatible XML feed of published jobs' })
  async linkedin(@Param('token') token: string, @Res() res: Response) {
    await this.send(res, token, 'linkedin');
  }

  private async send(res: Response, token: string, format: JobFeedFormat) {
    const xml = await this.renderJobFeed.execute(
      RenderJobFeedCommand.create({ token, format }),
    );
    res
      .status(200)
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=900')
      .send(xml);
  }
}
