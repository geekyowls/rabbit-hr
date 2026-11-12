import { Injectable } from '@nestjs/common';
import { EmailTemplateRepository } from '@db/repositories';
import { EmailTemplateEntity } from '@db/entities';
import { EmailTemplateCategory } from '@db/enums';
import { CreateEmailTemplateCommand } from './create-email-template.command';

@Injectable()
export class CreateEmailTemplate {
  constructor(
    private readonly emailTemplateRepository: EmailTemplateRepository,
  ) {}

  async execute(
    command: CreateEmailTemplateCommand,
  ): Promise<EmailTemplateEntity> {
    const { payload } = command;
    return this.emailTemplateRepository.save(
      this.emailTemplateRepository.create({
        organizationId: command.organizationId,
        name: payload.name,
        category: payload.category ?? EmailTemplateCategory.GENERAL,
        subject: payload.subject,
        body: payload.body,
        isDefault: payload.isDefault ?? false,
      }),
    );
  }
}
