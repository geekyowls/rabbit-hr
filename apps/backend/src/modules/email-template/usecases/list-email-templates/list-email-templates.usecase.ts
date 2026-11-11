import { Injectable } from '@nestjs/common';
import { EmailTemplateRepository } from '@db/repositories';
import { EmailTemplateEntity } from '@db/entities';
import { ListEmailTemplatesCommand } from './list-email-templates.command';

@Injectable()
export class ListEmailTemplates {
  constructor(
    private readonly emailTemplateRepository: EmailTemplateRepository,
  ) {}

  async execute(
    command: ListEmailTemplatesCommand,
  ): Promise<EmailTemplateEntity[]> {
    return this.emailTemplateRepository.find({
      where: {
        organizationId: command.organizationId,
        ...(command.category && { category: command.category }),
      },
      order: { category: 'ASC', name: 'ASC' },
    });
  }
}
