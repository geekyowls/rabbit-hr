import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ALL_PERMISSIONS } from '@boilerplate/core';
import { RoleRepository } from '@db/repositories';
import { RoleEntity } from '@db/entities';
import { CreateRoleCommand } from './create-role.command';

@Injectable()
export class CreateRole {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<RoleEntity> {
    const invalidPermissions = command.permissions.filter(
      (p) => !ALL_PERMISSIONS.includes(p as any),
    );
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: ${invalidPermissions.join(', ')}`,
      );
    }

    const existing = await this.roleRepository.findOne({
      where: { name: command.name, organizationId: command.organizationId },
    });
    if (existing) {
      throw new ConflictException('A role with this name already exists');
    }

    const role = this.roleRepository.create({
      name: command.name,
      permissions: command.permissions,
      organizationId: command.organizationId,
    });

    return this.roleRepository.save(role);
  }
}
