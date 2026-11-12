import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { InterviewResponseDto } from './dtos/interview.dto';
import { ListApplicationInterviews } from './usecases/list-application-interviews/list-application-interviews.usecase';

@ApiTags('Interviews')
@ApiCommonResponses()
@Controller('applications')
export class ApplicationInterviewsController {
  constructor(
    private readonly listApplicationInterviews: ListApplicationInterviews,
  ) {}

  @Get(':id/interviews')
  @RequirePermissions(PERMISSIONS_ENUM.INTERVIEW_LIST_READ)
  @ApiOperation({ summary: 'List interviews for an application' })
  @ApiResponse(InterviewResponseDto, 200, true)
  async list(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listApplicationInterviews.execute(id, user.organizationId);
  }
}
