import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PERMISSIONS_ENUM, PlanFeature } from '@boilerplate/core';
import { MailboxProvider } from '@db/enums';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePlanFeature } from '@shared/decorators/require-plan-feature.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  ConnectMailboxDto,
  MailboxAuthUrlDto,
  MailboxResponseDto,
  MailboxSyncResponseDto,
} from './dtos/mailbox.dto';
import { inboxRedirectUrl } from './helpers/frontend-url';
import { ConnectMailbox } from './usecases/connect-mailbox/connect-mailbox.usecase';
import { ConnectMailboxCommand } from './usecases/connect-mailbox/connect-mailbox.command';
import { HandleMailboxCallback } from './usecases/handle-mailbox-callback/handle-mailbox-callback.usecase';
import { HandleMailboxCallbackCommand } from './usecases/handle-mailbox-callback/handle-mailbox-callback.command';
import { ListMailboxes } from './usecases/list-mailboxes/list-mailboxes.usecase';
import { ListMailboxesCommand } from './usecases/list-mailboxes/list-mailboxes.command';
import { DisconnectMailbox } from './usecases/disconnect-mailbox/disconnect-mailbox.usecase';
import { TriggerMailboxSync } from './usecases/trigger-mailbox-sync/trigger-mailbox-sync.usecase';
import { MailboxCommand } from './usecases/mailbox.command';

@ApiTags('Mailboxes')
@ApiCommonResponses()
@Controller('mailboxes')
export class MailboxController {
  constructor(
    private readonly connectMailbox: ConnectMailbox,
    private readonly handleMailboxCallback: HandleMailboxCallback,
    private readonly listMailboxes: ListMailboxes,
    private readonly disconnectMailbox: DisconnectMailbox,
    private readonly triggerMailboxSync: TriggerMailboxSync,
    private readonly configService: ConfigService,
  ) {}

  private mailboxCommand(user: UserSessionData, mailboxId: string) {
    return MailboxCommand.create({
      userId: user.userId,
      organizationId: user.organizationId,
      mailboxId,
      permissions: user.permissions ?? [],
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @ApiOperation({ summary: 'List my mailboxes and shared mailboxes' })
  @ApiResponse(MailboxResponseDto, 200, true)
  async list(@UserSession() user: UserSessionData) {
    return this.listMailboxes.execute(
      ListMailboxesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        permissions: user.permissions ?? [],
      }),
    );
  }

  @Post('connect/:provider')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @RequirePlanFeature(PlanFeature.INBOX)
  @ApiOperation({ summary: 'Get the OAuth URL to connect a mailbox' })
  @ApiResponse(MailboxAuthUrlDto)
  async connect(
    @UserSession() user: UserSessionData,
    @Param('provider', new ParseEnumPipe(MailboxProvider))
    provider: MailboxProvider,
    @Body() dto: ConnectMailboxDto,
  ) {
    return this.connectMailbox.execute(
      ConnectMailboxCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        provider,
        shared: dto.shared ?? false,
        permissions: user.permissions ?? [],
      }),
    );
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'OAuth callback from Google or Microsoft' })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (error || !code || !state) {
      res.redirect(
        inboxRedirectUrl(this.configService, {
          error: error || 'Mailbox connection was cancelled',
        }),
      );
      return;
    }
    try {
      await this.handleMailboxCallback.execute(
        HandleMailboxCallbackCommand.create({ code, state }),
      );
      res.redirect(inboxRedirectUrl(this.configService, { connected: '1' }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Mailbox connection failed';
      res.redirect(inboxRedirectUrl(this.configService, { error: message }));
    }
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @ApiOperation({ summary: 'Disconnect a mailbox and remove its synced mail' })
  async remove(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.disconnectMailbox.execute(this.mailboxCommand(user, id));
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @RequirePlanFeature(PlanFeature.INBOX)
  @ApiOperation({ summary: 'Queue a sync for a mailbox now' })
  @ApiResponse(MailboxSyncResponseDto)
  async sync(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.triggerMailboxSync.execute(this.mailboxCommand(user, id));
  }
}
