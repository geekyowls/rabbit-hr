import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailTemplateRepository } from '@db/repositories';
import { EmailTemplateEntity } from '@db/entities';
import { pickDefined } from '@shared/helpers/pick-defined';
import { UpdateEmailTemplateCommand } from './update-email-template.command';

@Injectable()
export class UpdateEmailTemplate {
  constructor(
    private readonly emailTemplateRepository: EmailTemplateRepository,
  ) {}

  async execute(
    command: UpdateEmailTemplateCommand,
  ): Promise<EmailTemplateEntity> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id: command.templateId, organizationId: command.organizationId },
    });
    if (!template) {
      throw new NotFoundException('Email template not found');
    }
    Object.assign(template, pickDefined(command.payload));
    return this.emailTemplateRepository.save(template);
  }
}
