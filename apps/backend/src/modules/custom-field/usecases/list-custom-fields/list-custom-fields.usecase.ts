import { Injectable } from '@nestjs/common';
import { CustomFieldDefinitionRepository } from '@db/repositories';
import { ListCustomFieldsCommand } from './list-custom-fields.command';

@Injectable()
export class ListCustomFields {
  constructor(
    private readonly customFieldDefinitionRepository: CustomFieldDefinitionRepository,
  ) {}

  async execute(command: ListCustomFieldsCommand) {
    return this.customFieldDefinitionRepository.find({
      where: {
        organizationId: command.organizationId,
        ...(command.entity && { entity: command.entity }),
        ...(command.activeOnly && { isActive: true }),
      },
      order: { entity: 'ASC', order: 'ASC', createdAt: 'ASC' },
    });
  }
}
