import { Injectable } from '@nestjs/common';
import { WhatsappService } from '../../services/whatsapp.service';
import { WhatsappOrganizationCommand } from '../template.command';

@Injectable()
export class SyncWhatsappTemplates {
  constructor(private readonly whatsapp: WhatsappService) {}

  execute(command: WhatsappOrganizationCommand) {
    return this.whatsapp.syncTemplates(command.organizationId);
  }
}
