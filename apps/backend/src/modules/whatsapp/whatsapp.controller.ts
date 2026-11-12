import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '@shared/decorators/require-permissions.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  AddTemplateDto,
  ListCandidateWhatsappMessagesDto,
  UpdateTemplateMappingDto,
  WhatsappMessageDto,
} from './dtos/whatsapp.dto';
import { PLACEHOLDERS } from './services/placeholder.service';
import {
  WhatsappOrganizationCommand,
  WhatsappTemplateCommand,
} from './usecases/template.command';
import { ListWhatsappTemplates } from './usecases/list-templates/list-templates.usecase';
import { SyncWhatsappTemplates } from './usecases/sync-templates/sync-templates.usecase';
import { AddWhatsappTemplate } from './usecases/add-template/add-template.usecase';
import { AddWhatsappTemplateCommand } from './usecases/add-template/add-template.command';
import { DeleteWhatsappTemplate } from './usecases/delete-template/delete-template.usecase';
import { UpdateWhatsappTemplateMapping } from './usecases/update-template-mapping/update-template-mapping.usecase';
import { UpdateWhatsappTemplateMappingCommand } from './usecases/update-template-mapping/update-template-mapping.command';
import { PreviewWhatsappMessage } from './usecases/preview-message/preview-message.usecase';
import { SendWhatsappMessage } from './usecases/send-message/send-message.usecase';
import { WhatsappMessageCommand } from './usecases/send-message/whatsapp-message.command';
import { ListCandidateWhatsappMessages } from './usecases/list-candidate-messages/list-candidate-messages.usecase';
import { ListCandidateWhatsappMessagesCommand } from './usecases/list-candidate-messages/list-candidate-messages.command';

@ApiTags('WhatsApp')
@ApiCommonResponses()
@Controller()
export class WhatsappController {
  constructor(
    private readonly listTemplates: ListWhatsappTemplates,
    private readonly syncTemplates: SyncWhatsappTemplates,
    private readonly addTemplate: AddWhatsappTemplate,
    private readonly deleteTemplate: DeleteWhatsappTemplate,
    private readonly updateMapping: UpdateWhatsappTemplateMapping,
    private readonly previewMessage: PreviewWhatsappMessage,
    private readonly sendMessage: SendWhatsappMessage,
    private readonly listCandidateMessages: ListCandidateWhatsappMessages,
  ) {}

  private org(user: UserSessionData) {
    return WhatsappOrganizationCommand.create({
      userId: user.userId,
      organizationId: user.organizationId,
    });
  }

  private message(user: UserSessionData, dto: WhatsappMessageDto) {
    return WhatsappMessageCommand.create({
      userId: user.userId,
      organizationId: user.organizationId,
      templateId: dto.templateId,
      candidateId: dto.candidateId,
      applicationId: dto.applicationId,
    });
  }

  @Get('whatsapp/placeholders')
  @RequireAnyPermission(
    PERMISSIONS_ENUM.WHATSAPP_SEND,
    PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE,
  )
  @ApiOperation({ summary: 'Placeholders a template variable can map to' })
  placeholders() {
    return PLACEHOLDERS;
  }

  @Get('whatsapp/templates')
  @RequireAnyPermission(
    PERMISSIONS_ENUM.WHATSAPP_SEND,
    PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE,
  )
  @ApiOperation({ summary: 'WhatsApp templates and connection state' })
  templates(@UserSession() user: UserSessionData) {
    return this.listTemplates.execute(this.org(user));
  }

  @Post('whatsapp/templates/sync')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Pull templates from the connected provider' })
  sync(@UserSession() user: UserSessionData) {
    return this.syncTemplates.execute(this.org(user));
  }

  @Post('whatsapp/templates')
  @RequirePermissions(PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Add an approved template by hand' })
  add(@UserSession() user: UserSessionData, @Body() dto: AddTemplateDto) {
    return this.addTemplate.execute(
      AddWhatsappTemplateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        name: dto.name,
        language: dto.language,
        body: dto.body,
        headerText: dto.headerText,
      }),
    );
  }

  @Delete('whatsapp/templates/:id')
  @RequirePermissions(PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Remove a template' })
  remove(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) templateId: string,
  ) {
    return this.deleteTemplate.execute(
      WhatsappTemplateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        templateId,
      }),
    );
  }

  @Put('whatsapp/templates/:id/mapping')
  @RequirePermissions(PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Map template variables to placeholders or text' })
  mapping(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) templateId: string,
    @Body() dto: UpdateTemplateMappingDto,
  ) {
    return this.updateMapping.execute(
      UpdateWhatsappTemplateMappingCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        templateId,
        mapping: dto.mapping,
        label: dto.label,
      }),
    );
  }

  @Post('whatsapp/messages/preview')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.WHATSAPP_SEND)
  @ApiOperation({ summary: 'Render a template for a candidate' })
  preview(
    @UserSession() user: UserSessionData,
    @Body() dto: WhatsappMessageDto,
  ) {
    return this.previewMessage.execute(this.message(user, dto));
  }

  @Post('whatsapp/messages/send')
  @RequirePermissions(PERMISSIONS_ENUM.WHATSAPP_SEND)
  @ApiOperation({ summary: 'Queue a WhatsApp template message to a candidate' })
  send(@UserSession() user: UserSessionData, @Body() dto: WhatsappMessageDto) {
    return this.sendMessage.execute(this.message(user, dto));
  }

  @Get('candidates/:id/whatsapp-messages')
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_READ)
  @ApiOperation({ summary: 'WhatsApp messages sent to a candidate' })
  candidateMessages(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) candidateId: string,
    @Query() query: ListCandidateWhatsappMessagesDto,
  ) {
    return this.listCandidateMessages.execute(
      ListCandidateWhatsappMessagesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId,
        page: query.page,
        limit: query.limit,
      }),
    );
  }
}
