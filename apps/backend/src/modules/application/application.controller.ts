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
import {
  ApplicationBoardDto,
  CreateApplicationDto,
  ListApplicationsDto,
  UpdateApplicationDto,
  UpdateApplicationStageDto,
} from './dtos/application-request.dto';
import {
  ApplicationBoardResponseDto,
  ApplicationResponseDto,
} from './dtos/application-response.dto';
import { ListApplications } from './usecases/list-applications/list-applications.usecase';
import { ListApplicationsCommand } from './usecases/list-applications/list-applications.command';
import { GetApplicationBoard } from './usecases/get-application-board/get-application-board.usecase';
import { GetApplicationBoardCommand } from './usecases/get-application-board/get-application-board.command';
import { CreateApplication } from './usecases/create-application/create-application.usecase';
import { CreateApplicationCommand } from './usecases/create-application/create-application.command';
import { GetApplication } from './usecases/get-application/get-application.usecase';
import { UpdateApplicationStage } from './usecases/update-application-stage/update-application-stage.usecase';
import { UpdateApplicationStageCommand } from './usecases/update-application-stage/update-application-stage.command';
import { UpdateApplication } from './usecases/update-application/update-application.usecase';
import { UpdateApplicationCommand } from './usecases/update-application/update-application.command';
import { DeleteApplication } from './usecases/delete-application/delete-application.usecase';
import { DeleteApplicationCommand } from './usecases/delete-application/delete-application.command';

const DEFAULT_BOARD_LIMIT_PER_STAGE = 50;

@ApiTags('Applications')
@ApiCommonResponses()
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly listApplications: ListApplications,
    private readonly getApplicationBoard: GetApplicationBoard,
    private readonly createApplication: CreateApplication,
    private readonly getApplication: GetApplication,
    private readonly updateApplicationStage: UpdateApplicationStage,
    private readonly updateApplication: UpdateApplication,
    private readonly deleteApplication: DeleteApplication,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.APPLICATION_LIST_READ)
  @ApiOperation({ summary: 'List applications with pagination and filters' })
  @ApiOkPaginatedResponse(ApplicationResponseDto)
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListApplicationsDto,
  ) {
    return this.listApplications.execute(
      ListApplicationsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        jobId: dto.jobId,
        clientId: dto.clientId,
        candidateId: dto.candidateId,
        stage: dto.stage,
        stageCategory: dto.stageCategory,
        search: dto.search,
        shortlisted: dto.shortlisted,
        ownerId: dto.ownerId,
      }),
    );
  }

  @Post('board')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.APPLICATION_LIST_READ)
  @ApiOperation({ summary: 'Pipeline board grouped by stage' })
  @ApiResponse(ApplicationBoardResponseDto)
  async board(
    @UserSession() user: UserSessionData,
    @Body() dto: ApplicationBoardDto,
  ) {
    return this.getApplicationBoard.execute(
      GetApplicationBoardCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        jobId: dto.jobId,
        clientId: dto.clientId,
        search: dto.search,
        limitPerStage: dto.limitPerStage ?? DEFAULT_BOARD_LIMIT_PER_STAGE,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.APPLICATION_CREATE)
  @ApiOperation({ summary: 'Add a candidate to a job' })
  @ApiResponse(ApplicationResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.createApplication.execute(
      CreateApplicationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId: dto.candidateId,
        jobId: dto.jobId,
        stage: dto.stage,
        source: dto.source,
        ownerId: dto.ownerId,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.APPLICATION_READ)
  @ApiOperation({ summary: 'Get an application' })
  @ApiResponse(ApplicationResponseDto)
  async get(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getApplication.execute(id, user.organizationId);
  }

  @Patch(':id/stage')
  @RequirePermissions(PERMISSIONS_ENUM.APPLICATION_UPDATE)
  @ApiOperation({ summary: 'Move an application to another stage' })
  @ApiResponse(ApplicationResponseDto)
  async updateStage(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStageDto,
  ) {
    return this.updateApplicationStage.execute(
      UpdateApplicationStageCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        applicationId: id,
        stage: dto.stage,
        rejectionReason: dto.rejectionReason,
      }),
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS_ENUM.APPLICATION_UPDATE)
  @ApiOperation({ summary: 'Update rating, shortlist flag or owner' })
  @ApiResponse(ApplicationResponseDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.updateApplication.execute(
      UpdateApplicationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        applicationId: id,
        rating: dto.rating,
        shortlisted: dto.shortlisted,
        ownerId: dto.ownerId,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.APPLICATION_DELETE)
  @ApiOperation({ summary: 'Delete an application' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteApplication.execute(
      DeleteApplicationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        applicationId: id,
      }),
    );
  }
}
