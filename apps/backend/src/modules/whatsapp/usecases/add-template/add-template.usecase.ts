import { ConflictException, Injectable } from '@nestjs/common';
import { WhatsappTemplateRepository } from '@db/repositories';
import { WhatsappConnectionService } from '../../services/whatsapp-connection.service';
import { variableNumbers } from '../../providers/whatsapp-provider';
import { AddWhatsappTemplateCommand } from './add-template.command';

@Injectable()
export class AddWhatsappTemplate {
  constructor(
    private readonly templates: WhatsappTemplateRepository,
    private readonly connection: WhatsappConnectionService,
  ) {}

  async execute(command: AddWhatsappTemplateCommand) {
    const { organizationId } = command;
    const { provider } = await this.connection.require(organizationId);
    const language = command.language?.trim() ?? '';
    const existing = await this.templates.findOne({
      where: {
        organizationId,
        provider: provider.id,
        name: command.name,
        language,
      },
    });
    if (existing && !existing.addedManually) {
      throw new ConflictException(
        'This template is already synced from the provider',
      );
    }

    const headerText = command.headerText?.trim() || null;
    const headerKeys = variableNumbers(headerText).map((n) => `header.${n}`);
    const bodyKeys = variableNumbers(command.body).map((n) => `body.${n}`);
    const variableKeys = [...headerKeys, ...bodyKeys];

    const row =
      existing ??
      this.templates.create({
        organizationId,
        provider: provider.id,
        name: command.name,
        language,
        mapping: {},
      });
    row.category = null;
    row.status = 'APPROVED';
    row.body = command.body.trim();
    row.variableKeys = variableKeys;
    row.unsupportedReason =
      headerKeys.length > 1 ? 'Only one header variable is supported' : null;
    row.availableAtProvider = true;
    row.addedManually = true;
    row.lastSyncedAt = null;
    row.mapping = Object.fromEntries(
      Object.entries(row.mapping ?? {}).filter(([k]) =>
        variableKeys.includes(k),
      ),
    );
    return this.templates.save(row);
  }
}
