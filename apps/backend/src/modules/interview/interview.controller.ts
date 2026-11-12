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
import {
  CreateInterviewDto,
  InterviewDetailResponseDto,
  InterviewResponseDto,
  ListInterviewsDto,
  SubmitScorecardDto,
  UpdateInterviewDto,
  UpdateInterviewStatusDto,
} from './dtos/interview.dto';
import { ListInterviews } from './usecases/list-interviews/list-interviews.usecase';
import { ListInterviewsCommand } from './usecases/list-interviews/list-interviews.command';
import { CreateInterview } from './usecases/create-interview/create-interview.usecase';
import { CreateInterviewCommand } from './usecases/create-interview/create-interview.command';
import { GetInterview } from './usecases/get-interview/get-interview.usecase';
import { UpdateInterview } from './usecases/update-interview/update-interview.usecase';
import { UpdateInterviewCommand } from './usecases/update-interview/update-interview.command';
import { UpdateInterviewStatus } from './usecases/update-interview-status/update-interview-status.usecase';
import { UpdateInterviewStatusCommand } from './usecases/update-interview-status/update-interview-status.command';
import { DeleteInterview } from './usecases/delete-interview/delete-interview.usecase';
import { SubmitScorecard } from './usecases/submit-scorecard/submit-scorecard.usecase';
import { SubmitScorecardCommand } from './usecases/submit-scorecard/submit-scorecard.command';

@ApiTags('Interviews')
@ApiCommonResponses()
@Controller('interviews')
export class InterviewController {
  constructor(
    private readonly listInterviews: ListInterviews,
    private readonly createInterview: CreateInterview,
    private readonly getInterview: GetInterview,
    private readonly updateInterview: UpdateInterview,
    private readonly updateInterviewStatus: UpdateInterviewStatus,
    private readonly deleteInterview: DeleteInterview,
    private readonly submitScorecard: SubmitScorecard,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_LIST_READ)
  @ApiOperation({ summary: 'List interviews with pagination and filters' })
  @ApiOkPaginatedResponse(InterviewResponseDto)
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListInterviewsDto,
  ) {
    return this.listInterviews.execute(
      ListInterviewsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        from: dto.from,
        to: dto.to,
        status: dto.status,
        jobId: dto.jobId,
        candidateId: dto.candidateId,
        applicationId: dto.applicationId,
        interviewerId: dto.interviewerId,
        mine: dto.mine,
        needsFeedback: dto.needsFeedback,
      }),
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_CREATE)
  @ApiOperation({ summary: 'Schedule an interview' })
  @ApiResponse(InterviewDetailResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.createInterview.execute(
      CreateInterviewCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_READ)
  @ApiOperation({ summary: 'Get an interview with its scorecards' })
  @ApiResponse(InterviewDetailResponseDto)
  async get(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getInterview.execute(id, user.organizationId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_UPDATE)
  @ApiOperation({ summary: 'Update or reschedule an interview' })
  @ApiResponse(InterviewDetailResponseDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.updateInterview.execute(
      UpdateInterviewCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        interviewId: id,
        payload: dto,
      }),
    );
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_UPDATE)
  @ApiOperation({ summary: 'Complete, cancel or mark an interview as no show' })
  @ApiResponse(InterviewDetailResponseDto)
  async updateStatus(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewStatusDto,
  ) {
    return this.updateInterviewStatus.execute(
      UpdateInterviewStatusCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        interviewId: id,
        status: dto.status,
        reason: dto.reason,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_DELETE)
  @ApiOperation({ summary: 'Delete an interview' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteInterview.execute(id, user.organizationId, user.userId);
  }

  @Post(':id/scorecards')
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_SCORECARD_SUBMIT)
  @ApiOperation({ summary: 'Submit or update an interviewer scorecard' })
  @ApiResponse(InterviewDetailResponseDto, 201)
  async scorecard(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitScorecardDto,
  ) {
    return this.submitScorecard.execute(
      SubmitScorecardCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        interviewId: id,
        permissions: user.permissions ?? [],
        payload: dto,
      }),
    );
  }
}
