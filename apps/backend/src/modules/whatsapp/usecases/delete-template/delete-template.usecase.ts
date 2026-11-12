import { Injectable } from '@nestjs/common';
import { WhatsappTemplateRepository } from '@db/repositories';
import { WhatsappService } from '../../services/whatsapp.service';
import { WhatsappTemplateCommand } from '../template.command';

@Injectable()
export class DeleteWhatsappTemplate {
  constructor(
    private readonly templates: WhatsappTemplateRepository,
    private readonly whatsapp: WhatsappService,
  ) {}

  async execute(command: WhatsappTemplateCommand) {
    const template = await this.whatsapp.loadTemplate(
      command.organizationId,
      command.templateId,
    );
    await this.templates.remove(template);
    return { id: command.templateId, deleted: true };
  }
}
