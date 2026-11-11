import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  InitiateCallDto,
  ListCandidateCallsDto,
  UpdateCallDto,
} from './dtos/call.dto';
import { InitiateCall } from './usecases/initiate-call/initiate-call.usecase';
import { InitiateCallCommand } from './usecases/initiate-call/initiate-call.command';
import { ListCandidateCalls } from './usecases/list-candidate-calls/list-candidate-calls.usecase';
import { ListCandidateCallsCommand } from './usecases/list-candidate-calls/list-candidate-calls.command';
import { UpdateCall } from './usecases/update-call/update-call.usecase';
import { UpdateCallCommand } from './usecases/update-call/update-call.command';

@ApiTags('Calls')
@ApiCommonResponses()
@Controller()
export class CallController {
  constructor(
    private readonly initiateCall: InitiateCall,
    private readonly listCandidateCalls: ListCandidateCalls,
    private readonly updateCall: UpdateCall,
  ) {}

  @Post('candidates/:id/calls/initiate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.CALL_CREATE)
  @ApiOperation({
    summary: 'Click to call: rings the recruiter, then the candidate',
  })
  async initiate(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) candidateId: string,
    @Body() dto: InitiateCallDto,
  ) {
    return this.initiateCall.execute(
      InitiateCallCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId,
        staffPhone: dto.staffPhone,
        applicationId: dto.applicationId,
      }),
    );
  }

  @Get('candidates/:id/calls')
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_READ)
  @ApiOperation({ summary: 'Calls with a candidate, newest first' })
  async list(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) candidateId: string,
    @Query() query: ListCandidateCallsDto,
  ) {
    return this.listCandidateCalls.execute(
      ListCandidateCallsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId,
        page: query.page,
        limit: query.limit,
      }),
    );
  }

  @Patch('calls/:id')
  @RequirePermissions(PERMISSIONS_ENUM.CALL_CREATE)
  @ApiOperation({ summary: 'Set the disposition and note of a call' })
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) callId: string,
    @Body() dto: UpdateCallDto,
  ) {
    return this.updateCall.execute(
      UpdateCallCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        callId,
        disposition: dto.disposition,
        note: dto.note,
      }),
    );
  }
}
