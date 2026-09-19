import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ALL_PERMISSIONS, EventName } from '@boilerplate/core';
import type { RoleUpdatedEvent } from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { RoleRepository } from '@db/repositories';
import { RoleEntity } from '@db/entities';
import { UpdateRoleCommand } from './update-role.command';

@Injectable()
export class UpdateRole {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<RoleEntity> {
    const role = await this.roleRepository.findById(command.roleId);
    if (!role || role.organizationId !== command.organizationId) {
      throw new NotFoundException('Role not found');
    }

    if (command.permissions) {
      const invalidPermissions = command.permissions.filter(
        (p) => !ALL_PERMISSIONS.includes(p as any),
      );
      if (invalidPermissions.length > 0) {
        throw new BadRequestException(
          `Invalid permissions: ${invalidPermissions.join(', ')}`,
        );
      }
    }

    const oldPermissions = JSON.stringify([...role.permissions].sort());

    if (command.name && command.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: command.name, organizationId: command.organizationId },
      });
      if (existing) {
        throw new ConflictException('A role with this name already exists');
      }
      role.name = command.name;
    }

    if (command.permissions) {
      role.permissions = command.permissions;
    }

    const saved = await this.roleRepository.save(role);

    const newPermissions = JSON.stringify([...saved.permissions].sort());
    const permissionsChanged = oldPermissions !== newPermissions;

    this.eventEmitter.emit<RoleUpdatedEvent>({
      eventName: EventName.ROLE_UPDATED,
      roleId: saved.id,
      organizationId: command.organizationId,
      updatedBy: command.userId,
      permissionsChanged,
      timestamp: new Date(),
    });

    return saved;
  }
}
