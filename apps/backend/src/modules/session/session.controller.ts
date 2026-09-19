import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';

import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { SessionResponseDto } from './dtos/session-response.dto';
import { ListSessions } from './usecases/list-sessions/list-sessions.usecase';
import { ListSessionsCommand } from './usecases/list-sessions/list-sessions.command';
import { RevokeSession } from './usecases/revoke-session/revoke-session.usecase';
import { RevokeSessionCommand } from './usecases/revoke-session/revoke-session.command';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionController {
  constructor(
    private readonly listSessions: ListSessions,
    private readonly revokeSession: RevokeSession,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_SETTINGS)
  @ApiOperation({ summary: 'List active sessions across the organization' })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  async list(
    @UserSession() user: UserSessionData,
  ): Promise<SessionResponseDto[]> {
    return this.listSessions.execute(
      ListSessionsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_SETTINGS)
  @ApiOperation({ summary: 'Revoke an active session (force sign out)' })
  @ApiResponse({ status: 200 })
  async revoke(
    @UserSession() user: UserSessionData,
    @Param('id') id: string,
  ): Promise<void> {
    return this.revokeSession.execute(
      RevokeSessionCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        sessionId: id,
      }),
    );
  }
}
