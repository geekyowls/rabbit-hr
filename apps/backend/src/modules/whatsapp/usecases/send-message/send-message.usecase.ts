import { Injectable } from '@nestjs/common';
import { WhatsappService } from '../../services/whatsapp.service';
import { WhatsappMessageCommand } from './whatsapp-message.command';

@Injectable()
export class SendWhatsappMessage {
  constructor(private readonly whatsapp: WhatsappService) {}

  execute(command: WhatsappMessageCommand) {
    return this.whatsapp.send({
      organizationId: command.organizationId,
      templateId: command.templateId,
      candidateId: command.candidateId,
      applicationId: command.applicationId ?? null,
      senderId: command.userId,
    });
  }
}
