import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomFieldDefinitionEntity } from '@db/entities';
import { CustomFieldDefinitionRepository } from '@db/repositories';
import { ListCustomFields } from '../list-custom-fields/list-custom-fields.usecase';
import { ListCustomFieldsCommand } from '../list-custom-fields/list-custom-fields.command';
import { ReorderCustomFieldsCommand } from './reorder-custom-fields.command';

@Injectable()
export class ReorderCustomFields {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customFieldDefinitionRepository: CustomFieldDefinitionRepository,
    private readonly listCustomFields: ListCustomFields,
  ) {}

  async execute(command: ReorderCustomFieldsCommand) {
    const { organizationId, entity, ids } = command;
    const definitions = await this.customFieldDefinitionRepository.find({
      where: { organizationId, entity },
      select: ['id'],
    });
    const known = new Set(definitions.map((d) => d.id));
    const unique = new Set(ids);
    if (
      unique.size !== ids.length ||
      ids.length !== known.size ||
      ids.some((id) => !known.has(id))
    ) {
      throw new BadRequestException(
        `ids must list every ${entity} custom field exactly once`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      for (const [index, id] of ids.entries()) {
        await manager.update(
          CustomFieldDefinitionEntity,
          { id, organizationId },
          { order: index },
        );
      }
    });

    return this.listCustomFields.execute(
      ListCustomFieldsCommand.create({
        userId: command.userId,
        organizationId,
        entity,
      }),
    );
  }
}
