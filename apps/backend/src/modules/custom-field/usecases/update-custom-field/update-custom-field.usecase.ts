import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomFieldDefinitionRepository } from '@db/repositories';
import { pickDefined } from '@shared/helpers/pick-defined';
import {
  assertDefinitionRules,
  countCustomFieldValues,
  normalizeOptions,
} from '../custom-field-rules';
import { UpdateCustomFieldCommand } from './update-custom-field.command';

@Injectable()
export class UpdateCustomField {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customFieldDefinitionRepository: CustomFieldDefinitionRepository,
  ) {}

  async execute(command: UpdateCustomFieldCommand) {
    const definition = await this.customFieldDefinitionRepository.findOne({
      where: {
        id: command.customFieldId,
        organizationId: command.organizationId,
      },
    });
    if (!definition) {
      throw new NotFoundException('Custom field not found');
    }

    const { options, type, ...rest } = pickDefined(command.payload);
    if (type && type !== definition.type) {
      const values = await countCustomFieldValues(this.dataSource, definition);
      if (values > 0) {
        throw new BadRequestException(
          'The type cannot change while records have values for this field',
        );
      }
      definition.type = type;
    }
    Object.assign(definition, rest);
    if (options) definition.options = normalizeOptions(options);
    assertDefinitionRules(definition);

    return this.customFieldDefinitionRepository.save(definition);
  }
}
