import { Injectable } from '@nestjs/common';
import { WhatsappConnectionService } from '../../services/whatsapp-connection.service';
import { WhatsappService } from '../../services/whatsapp.service';
import { WhatsappOrganizationCommand } from '../template.command';

@Injectable()
export class ListWhatsappTemplates {
  constructor(
    private readonly connection: WhatsappConnectionService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async execute(command: WhatsappOrganizationCommand) {
    const connection = await this.connection.find(command.organizationId);
    const provider = connection?.provider.id ?? null;
    return {
      connected: connection !== null,
      provider,
      templates: await this.whatsapp.listTemplates(
        command.organizationId,
        provider ?? undefined,
      ),
    };
  }
}
