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
import { PERMISSIONS_ENUM, PlanFeature } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePlanFeature } from '@shared/decorators/require-plan-feature.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  InboxStatsDto,
  InboxStatsQueryDto,
  ListThreadsDto,
  SendInboxMessageDto,
  UpdateThreadDto,
} from './dtos/inbox.dto';
import { ListThreads } from './usecases/list-threads/list-threads.usecase';
import { ListThreadsCommand } from './usecases/list-threads/list-threads.command';
import { GetThread } from './usecases/get-thread/get-thread.usecase';
import { InboxThreadCommand } from './usecases/inbox-thread.command';
import { UpdateThread } from './usecases/update-thread/update-thread.usecase';
import { UpdateThreadCommand } from './usecases/update-thread/update-thread.command';
import { SendInboxMessage } from './usecases/send-message/send-message.usecase';
import { SendMessageCommand } from './usecases/send-message/send-message.command';
import { GetInboxStats } from './usecases/get-inbox-stats/get-inbox-stats.usecase';
import { GetInboxStatsCommand } from './usecases/get-inbox-stats/get-inbox-stats.command';

@ApiTags('Inbox')
@ApiCommonResponses()
@Controller('inbox')
export class InboxController {
  constructor(
    private readonly listThreads: ListThreads,
    private readonly getThread: GetThread,
    private readonly updateThread: UpdateThread,
    private readonly sendInboxMessage: SendInboxMessage,
    private readonly getInboxStats: GetInboxStats,
  ) {}

  @Post('threads/list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @RequirePlanFeature(PlanFeature.INBOX)
  @ApiOperation({ summary: 'List email threads, newest first' })
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListThreadsDto,
  ) {
    return this.listThreads.execute(
      ListThreadsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        mailboxId: dto.mailboxId,
        folder: dto.folder,
        unreadOnly: dto.unreadOnly,
        search: dto.search || undefined,
        searchIn: dto.searchIn,
        linked: dto.linked,
        candidateId: dto.candidateId,
        clientId: dto.clientId,
      }),
    );
  }

  @Get('stats')
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @ApiOperation({ summary: 'Inbox counters and reply times' })
  @ApiResponse(InboxStatsDto)
  async stats(
    @UserSession() user: UserSessionData,
    @Query() query: InboxStatsQueryDto,
  ) {
    return this.getInboxStats.execute(
      GetInboxStatsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        mailboxId: query.mailboxId,
      }),
    );
  }

  @Get('threads/:id')
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @RequirePlanFeature(PlanFeature.INBOX)
  @ApiOperation({ summary: 'Get a thread with its messages, oldest first' })
  async get(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getThread.execute(
      InboxThreadCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        threadId: id,
      }),
    );
  }

  @Patch('threads/:id')
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_READ)
  @RequirePlanFeature(PlanFeature.INBOX)
  @ApiOperation({ summary: 'Mark read, archive, move or link a thread' })
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateThreadDto,
  ) {
    return this.updateThread.execute(
      UpdateThreadCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        threadId: id,
        ...dto,
      }),
    );
  }

  @Post('messages/send')
  @RequirePermissions(PERMISSIONS_ENUM.INBOX_SEND)
  @RequirePlanFeature(PlanFeature.INBOX)
  @ApiOperation({ summary: 'Send a new email or a reply from a mailbox' })
  async send(
    @UserSession() user: UserSessionData,
    @Body() dto: SendInboxMessageDto,
  ) {
    return this.sendInboxMessage.execute(
      SendMessageCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        mailboxId: dto.mailboxId,
        threadId: dto.threadId,
        inReplyToMessageId: dto.inReplyToMessageId,
        to: dto.to ?? [],
        cc: dto.cc ?? [],
        bcc: dto.bcc ?? [],
        subject: dto.subject,
        html: dto.html,
        templateId: dto.templateId,
        candidateId: dto.candidateId,
        applicationId: dto.applicationId,
        clientId: dto.clientId,
      }),
    );
  }
}
