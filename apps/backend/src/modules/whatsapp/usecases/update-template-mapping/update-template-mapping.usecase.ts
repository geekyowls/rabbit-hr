import { BadRequestException, Injectable } from '@nestjs/common';
import { WhatsappVariableSource } from '@db/entities';
import { WhatsappTemplateRepository } from '@db/repositories';
import { WhatsappService } from '../../services/whatsapp.service';
import { isPlaceholderKey } from '../../services/placeholder.service';
import { UpdateWhatsappTemplateMappingCommand } from './update-template-mapping.command';

const MAX_TEXT = 1024;

@Injectable()
export class UpdateWhatsappTemplateMapping {
  constructor(
    private readonly templates: WhatsappTemplateRepository,
    private readonly whatsapp: WhatsappService,
  ) {}

  async execute(command: UpdateWhatsappTemplateMappingCommand) {
    const template = await this.whatsapp.loadTemplate(
      command.organizationId,
      command.templateId,
    );

    const mapping: Record<string, WhatsappVariableSource> = {};
    for (const [key, raw] of Object.entries(command.mapping)) {
      if (!template.variableKeys.includes(key)) {
        throw new BadRequestException(`Unknown template variable "${key}"`);
      }
      const source = raw as Partial<{
        type: string;
        key: string;
        value: string;
      }> | null;
      if (source?.type === 'placeholder' && typeof source.key === 'string') {
        if (!isPlaceholderKey(source.key)) {
          throw new BadRequestException(`Unknown placeholder "${source.key}"`);
        }
        mapping[key] = { type: 'placeholder', key: source.key };
      } else if (source?.type === 'text' && typeof source.value === 'string') {
        const value = source.value.trim();
        if (!value) continue;
        if (value.length > MAX_TEXT) {
          throw new BadRequestException(`Text for "${key}" is too long`);
        }
        mapping[key] = { type: 'text', value };
      } else if (raw !== null && raw !== undefined) {
        throw new BadRequestException(`Invalid mapping for "${key}"`);
      }
    }

    template.mapping = mapping;
    if (command.label !== undefined) {
      template.label = command.label.trim() || null;
    }
    return this.templates.save(template);
  }
}
