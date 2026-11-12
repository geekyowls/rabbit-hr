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
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  CreateEmailTemplateDto,
  EmailTemplateResponseDto,
  ListEmailTemplatesQueryDto,
  SendApplicationEmailDto,
  SendApplicationEmailResponseDto,
  UpdateEmailTemplateDto,
} from './dtos/email-template.dto';
import { ListEmailTemplates } from './usecases/list-email-templates/list-email-templates.usecase';
import { ListEmailTemplatesCommand } from './usecases/list-email-templates/list-email-templates.command';
import { CreateEmailTemplate } from './usecases/create-email-template/create-email-template.usecase';
import { CreateEmailTemplateCommand } from './usecases/create-email-template/create-email-template.command';
import { UpdateEmailTemplate } from './usecases/update-email-template/update-email-template.usecase';
import { UpdateEmailTemplateCommand } from './usecases/update-email-template/update-email-template.command';
import { DeleteEmailTemplate } from './usecases/delete-email-template/delete-email-template.usecase';
import { DeleteEmailTemplateCommand } from './usecases/delete-email-template/delete-email-template.command';
import { SendApplicationEmail } from './usecases/send-application-email/send-application-email.usecase';
import { SendApplicationEmailCommand } from './usecases/send-application-email/send-application-email.command';

@ApiTags('Email Templates')
@ApiCommonResponses()
@Controller()
export class EmailTemplateController {
  constructor(
    private readonly listEmailTemplates: ListEmailTemplates,
    private readonly createEmailTemplate: CreateEmailTemplate,
    private readonly updateEmailTemplate: UpdateEmailTemplate,
    private readonly deleteEmailTemplate: DeleteEmailTemplate,
    private readonly sendApplicationEmail: SendApplicationEmail,
  ) {}

  @Get('email-templates')
  @RequirePermissions(PERMISSIONS_ENUM.EMAIL_TEMPLATE_READ)
  @ApiOperation({ summary: 'List email templates' })
  @ApiResponse(EmailTemplateResponseDto, 200, true)
  async list(
    @UserSession() user: UserSessionData,
    @Query() query: ListEmailTemplatesQueryDto,
  ) {
    return this.listEmailTemplates.execute(
      ListEmailTemplatesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        category: query.category,
      }),
    );
  }

  @Post('email-templates')
  @RequirePermissions(PERMISSIONS_ENUM.EMAIL_TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Create an email template' })
  @ApiResponse(EmailTemplateResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateEmailTemplateDto,
  ) {
    return this.createEmailTemplate.execute(
      CreateEmailTemplateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }

  @Put('email-templates/:id')
  @RequirePermissions(PERMISSIONS_ENUM.EMAIL_TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Update an email template' })
  @ApiResponse(EmailTemplateResponseDto)
  async update(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.updateEmailTemplate.execute(
      UpdateEmailTemplateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        templateId: id,
        payload: dto,
      }),
    );
  }

  @Delete('email-templates/:id')
  @RequirePermissions(PERMISSIONS_ENUM.EMAIL_TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Delete an email template' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteEmailTemplate.execute(
      DeleteEmailTemplateCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        templateId: id,
      }),
    );
  }

  @Post('applications/:id/email')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.EMAIL_TEMPLATE_SEND)
  @ApiOperation({ summary: 'Email the candidate on an application' })
  @ApiResponse(SendApplicationEmailResponseDto)
  async send(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendApplicationEmailDto,
  ) {
    return this.sendApplicationEmail.execute(
      SendApplicationEmailCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        applicationId: id,
        templateId: dto.templateId,
        subject: dto.subject,
        body: dto.body,
      }),
    );
  }
}
