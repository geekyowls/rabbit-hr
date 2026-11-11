import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailTemplateRepository } from '@db/repositories';
import { DeleteEmailTemplateCommand } from './delete-email-template.command';

@Injectable()
export class DeleteEmailTemplate {
  constructor(
    private readonly emailTemplateRepository: EmailTemplateRepository,
  ) {}

  async execute(
    command: DeleteEmailTemplateCommand,
  ): Promise<{ success: boolean }> {
    const result = await this.emailTemplateRepository.delete({
      id: command.templateId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Email template not found');
    }
    return { success: true };
  }
}
