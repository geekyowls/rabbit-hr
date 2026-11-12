import { Injectable } from '@nestjs/common';
import { WhatsappService } from '../../services/whatsapp.service';
import { WhatsappMessageCommand } from '../send-message/whatsapp-message.command';

@Injectable()
export class PreviewWhatsappMessage {
  constructor(private readonly whatsapp: WhatsappService) {}

  execute(command: WhatsappMessageCommand) {
    return this.whatsapp.preview({
      organizationId: command.organizationId,
      templateId: command.templateId,
      candidateId: command.candidateId,
      applicationId: command.applicationId ?? null,
      senderId: command.userId,
    });
  }
}
