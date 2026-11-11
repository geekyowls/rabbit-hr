import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { ListJobsDto } from './dtos/list-jobs.dto';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto, UpdateJobStatusDto } from './dtos/update-job.dto';
import { JobListItemDto } from './dtos/job-response.dto';
import { ListJobs } from './usecases/list-jobs/list-jobs.usecase';
import { ListJobsCommand } from './usecases/list-jobs/list-jobs.command';
import { CreateJob } from './usecases/create-job/create-job.usecase';
import { CreateJobCommand } from './usecases/create-job/create-job.command';
import { GetJob } from './usecases/get-job/get-job.usecase';
import { UpdateJob } from './usecases/update-job/update-job.usecase';
import { UpdateJobCommand } from './usecases/update-job/update-job.command';
import { UpdateJobStatus } from './usecases/update-job-status/update-job-status.usecase';
import { UpdateJobStatusCommand } from './usecases/update-job-status/update-job-status.command';
import { DeleteJob } from './usecases/delete-job/delete-job.usecase';
import { DeleteJobCommand } from './usecases/delete-job/delete-job.command';

@ApiTags('Jobs')
@ApiCommonResponses()
@Controller('jobs')
export class JobController {
  constructor(
    private readonly listJobs: ListJobs,
    private readonly createJob: CreateJob,
    private readonly getJob: GetJob,
    private readonly updateJob: UpdateJob,
    private readonly updateJobStatus: UpdateJobStatus,
    private readonly deleteJob: DeleteJob,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.JOB_LIST_READ)
  @ApiOperation({ summary: 'List jobs with application counts per stage' })
  @ApiOkPaginatedResponse(JobListItemDto)
  async list(@UserSession() user: UserSessionData, @Body() dto: ListJobsDto) {
    return this.listJobs.execute(
      ListJobsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        search: dto.search,
        status: dto.status,
        clientId: dto.clientId,
        employmentType: dto.employmentType,
        ownerId: dto.ownerId,
        department: dto.department,
        hiringManagerId: dto.hiringManagerId,
        recruiterId: dto.recruiterId,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.JOB_CREATE)
  @ApiOperation({ summary: 'Create a job' })
  @ApiResponse(JobListItemDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateJobDto,
  ) {
    return this.createJob.execute(
      CreateJobCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.JOB_READ)
  @ApiOperation({ summary: 'Get a job' })
  @ApiResponse(JobListItemDto)
  async get(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getJob.execute(id, user.organizationId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.JOB_UPDATE)
  @ApiOperation({ summary: 'Update a job' })
  @ApiResponse(JobListItemDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.updateJob.execute(
      UpdateJobCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        jobId: id,
        payload: dto,
      }),
    );
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS_ENUM.JOB_UPDATE)
  @ApiOperation({ summary: 'Change job status' })
  @ApiResponse(JobListItemDto)
  async updateStatus(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.updateJobStatus.execute(
      UpdateJobStatusCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        jobId: id,
        status: dto.status,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.JOB_DELETE)
  @ApiOperation({ summary: 'Delete a job' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteJob.execute(
      DeleteJobCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        jobId: id,
      }),
    );
  }
}
