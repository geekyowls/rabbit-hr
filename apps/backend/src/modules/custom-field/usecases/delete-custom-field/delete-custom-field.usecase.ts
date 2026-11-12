import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomFieldDefinitionRepository } from '@db/repositories';
import { countCustomFieldValues } from '../custom-field-rules';
import { DeleteCustomFieldCommand } from './delete-custom-field.command';

@Injectable()
export class DeleteCustomField {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customFieldDefinitionRepository: CustomFieldDefinitionRepository,
  ) {}

  async execute(
    command: DeleteCustomFieldCommand,
  ): Promise<{ deleted: boolean; deactivated: boolean }> {
    const definition = await this.customFieldDefinitionRepository.findOne({
      where: {
        id: command.customFieldId,
        organizationId: command.organizationId,
      },
    });
    if (!definition) {
      throw new NotFoundException('Custom field not found');
    }

    const values = await countCustomFieldValues(this.dataSource, definition);
    if (values > 0) {
      await this.customFieldDefinitionRepository.update(
        { id: definition.id },
        { isActive: false },
      );
      return { deleted: false, deactivated: true };
    }

    await this.customFieldDefinitionRepository.delete({ id: definition.id });
    return { deleted: true, deactivated: false };
  }
}
