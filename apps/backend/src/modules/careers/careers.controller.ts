import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  ApplyToJobDto,
  ApplyToJobResponseDto,
  CareersJobDetailDto,
  CareersJobListItemDto,
  CareersOrganizationDto,
  CareersUploadUrlDto,
  CareersUploadUrlResponseDto,
  ListCareersJobsQueryDto,
} from './dtos/careers.dto';
import { GetCareersOrganization } from './usecases/get-careers-organization/get-careers-organization.usecase';
import { GetCareersOrganizationCommand } from './usecases/get-careers-organization/get-careers-organization.command';
import { ListCareersJobs } from './usecases/list-careers-jobs/list-careers-jobs.usecase';
import { ListCareersJobsCommand } from './usecases/list-careers-jobs/list-careers-jobs.command';
import { GetCareersJob } from './usecases/get-careers-job/get-careers-job.usecase';
import { GetCareersJobCommand } from './usecases/get-careers-job/get-careers-job.command';
import { ApplyToJob } from './usecases/apply-to-job/apply-to-job.usecase';
import { ApplyToJobCommand } from './usecases/apply-to-job/apply-to-job.command';
import { GetCareersUploadUrl } from './usecases/get-careers-upload-url/get-careers-upload-url.usecase';
import { GetCareersUploadUrlCommand } from './usecases/get-careers-upload-url/get-careers-upload-url.command';

const READ_LIMITS = {
  short: { limit: 5, ttl: 1000 },
  medium: { limit: 30, ttl: 10000 },
  long: { limit: 100, ttl: 60000 },
};

const WRITE_LIMITS = {
  short: { limit: 1, ttl: 1000 },
  medium: { limit: 3, ttl: 10000 },
  long: { limit: 10, ttl: 60000 },
};

@ApiTags('Public Careers')
@ApiCommonResponses()
@Controller('public/careers')
export class CareersController {
  constructor(
    private readonly getCareersOrganization: GetCareersOrganization,
    private readonly listCareersJobs: ListCareersJobs,
    private readonly getCareersJob: GetCareersJob,
    private readonly applyToJob: ApplyToJob,
    private readonly getCareersUploadUrl: GetCareersUploadUrl,
  ) {}

  @Get(':orgSlug')
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'Public careers page organization details' })
  @ApiResponse(CareersOrganizationDto)
  async organization(@Param('orgSlug') orgSlug: string) {
    return this.getCareersOrganization.execute(
      GetCareersOrganizationCommand.create({ orgSlug }),
    );
  }

  @Get(':orgSlug/jobs')
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'List published jobs on the careers page' })
  @ApiOkPaginatedResponse(CareersJobListItemDto)
  async jobs(
    @Param('orgSlug') orgSlug: string,
    @Query() query: ListCareersJobsQueryDto,
  ) {
    return this.listCareersJobs.execute(
      ListCareersJobsCommand.create({
        orgSlug,
        page: query.page,
        limit: query.limit,
        search: query.search,
        employmentType: query.employmentType,
        location: query.location,
      }),
    );
  }

  @Get(':orgSlug/jobs/:jobId')
  @Throttle(READ_LIMITS)
  @ApiOperation({ summary: 'Get a published job on the careers page' })
  @ApiResponse(CareersJobDetailDto)
  async job(
    @Param('orgSlug') orgSlug: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.getCareersJob.execute(
      GetCareersJobCommand.create({ orgSlug, jobId }),
    );
  }

  @Post(':orgSlug/jobs/:jobId/apply')
  @Throttle(WRITE_LIMITS)
  @ApiOperation({ summary: 'Apply for a published job' })
  @ApiResponse(ApplyToJobResponseDto, 201)
  async apply(
    @Param('orgSlug') orgSlug: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: ApplyToJobDto,
  ) {
    return this.applyToJob.execute(
      ApplyToJobCommand.create({ orgSlug, jobId, payload: dto }),
    );
  }

  @Post(':orgSlug/upload-url')
  @HttpCode(HttpStatus.OK)
  @Throttle(WRITE_LIMITS)
  @ApiOperation({
    summary: 'Get a presigned URL to upload a CV (pdf, doc, docx)',
  })
  @ApiResponse(CareersUploadUrlResponseDto)
  async uploadUrl(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: CareersUploadUrlDto,
  ) {
    return this.getCareersUploadUrl.execute(
      GetCareersUploadUrlCommand.create({
        orgSlug,
        extension: dto.extension,
        sizeBytes: dto.sizeBytes,
      }),
    );
  }
}
