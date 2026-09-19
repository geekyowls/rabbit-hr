import { ConflictException, Injectable } from '@nestjs/common';
import { OrganizationConfigRepository } from '@db/repositories';
import { OrganizationConfigEntity } from '@db/entities';
import { CreateConfigCommand } from './create-config.command';

@Injectable()
export class CreateConfig {
  constructor(
    private readonly organizationConfigRepository: OrganizationConfigRepository,
  ) {}

  async execute(
    command: CreateConfigCommand,
  ): Promise<OrganizationConfigEntity> {
    const existing = await this.organizationConfigRepository.findOne({
      where: {
        organizationId: command.organizationId,
        type: command.type,
        name: command.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A ${command.type.replace('_', ' ')} with this name already exists`,
      );
    }

    const config = this.organizationConfigRepository.create({
      organizationId: command.organizationId,
      type: command.type,
      name: command.name,
      value: command.value ?? null,
      isDefault: false,
    });

    return this.organizationConfigRepository.save(config);
  }
}
