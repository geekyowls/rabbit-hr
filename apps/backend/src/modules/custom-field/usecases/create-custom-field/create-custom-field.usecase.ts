import { ConflictException, Injectable } from '@nestjs/common';
import { CustomFieldDefinitionRepository } from '@db/repositories';
import { toSlugKey } from '@shared/helpers/slug-key';
import { assertDefinitionRules, normalizeOptions } from '../custom-field-rules';
import { CreateCustomFieldCommand } from './create-custom-field.command';

@Injectable()
export class CreateCustomField {
  constructor(
    private readonly customFieldDefinitionRepository: CustomFieldDefinitionRepository,
  ) {}

  async execute(command: CreateCustomFieldCommand) {
    const { payload, organizationId } = command;
    const key = payload.key ?? toSlugKey(payload.label, 'field');

    const exists = await this.customFieldDefinitionRepository.exists({
      where: { organizationId, entity: payload.entity, key },
    });
    if (exists) {
      throw new ConflictException(
        `A ${payload.entity} field with key ${key} already exists`,
      );
    }

    const definition = this.customFieldDefinitionRepository.create({
      organizationId,
      entity: payload.entity,
      key,
      label: payload.label,
      type: payload.type,
      options: normalizeOptions(payload.options),
      required: payload.required ?? false,
      isActive: payload.isActive ?? true,
      showOnCareersForm: payload.showOnCareersForm ?? false,
    });
    assertDefinitionRules(definition);

    const last = await this.customFieldDefinitionRepository.findOne({
      where: { organizationId, entity: payload.entity },
      order: { order: 'DESC' },
      select: ['id', 'order'],
    });
    definition.order = last ? last.order + 1 : 0;

    return this.customFieldDefinitionRepository.save(definition);
  }
}
