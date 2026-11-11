import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequireAnyPermission } from '@shared/decorators/require-permissions.decorator';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  ActivityResponseDto,
  CreateActivityDto,
  ListActivitiesDto,
} from './dtos/activity.dto';
import { ActivityType } from '@db/enums';
import { ListActivities } from './usecases/list-activities/list-activities.usecase';
import { ListActivitiesCommand } from './usecases/list-activities/list-activities.command';
import { CreateActivity } from './usecases/create-activity/create-activity.usecase';
import { CreateActivityCommand } from './usecases/create-activity/create-activity.command';

@ApiTags('Activities')
@ApiCommonResponses()
@Controller('activities')
export class ActivityController {
  constructor(
    private readonly listActivities: ListActivities,
    private readonly createActivity: CreateActivity,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequireAnyPermission(
    PERMISSIONS_ENUM.CANDIDATE_READ,
    PERMISSIONS_ENUM.APPLICATION_READ,
    PERMISSIONS_ENUM.JOB_READ,
    PERMISSIONS_ENUM.CLIENT_READ,
  )
  @ApiOperation({ summary: 'List activities, newest first' })
  @ApiOkPaginatedResponse(ActivityResponseDto)
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListActivitiesDto,
  ) {
    return this.listActivities.execute(
      ListActivitiesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        candidateId: dto.candidateId,
        applicationId: dto.applicationId,
        jobId: dto.jobId,
        clientId: dto.clientId,
      }),
    );
  }

  @Post()
  @RequireAnyPermission(
    PERMISSIONS_ENUM.CANDIDATE_UPDATE,
    PERMISSIONS_ENUM.APPLICATION_UPDATE,
    PERMISSIONS_ENUM.JOB_UPDATE,
    PERMISSIONS_ENUM.CLIENT_UPDATE,
  )
  @ApiOperation({ summary: 'Add a note, call or email log' })
  @ApiResponse(ActivityResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateActivityDto,
  ) {
    return this.createActivity.execute(
      CreateActivityCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        type: dto.type ?? ActivityType.NOTE,
        title: dto.title,
        body: dto.body,
        candidateId: dto.candidateId,
        applicationId: dto.applicationId,
        jobId: dto.jobId,
        clientId: dto.clientId,
      }),
    );
  }
}
