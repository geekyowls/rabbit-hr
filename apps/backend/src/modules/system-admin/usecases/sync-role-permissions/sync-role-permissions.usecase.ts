import { Injectable, NotFoundException } from '@nestjs/common';
import { ALL_PERMISSIONS } from '@boilerplate/core';
import { RoleRepository, OrganizationRepository } from '@db/repositories';
import { SyncRolePermissionsCommand } from './sync-role-permissions.command';

@Injectable()
export class SyncRolePermissions {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(command: SyncRolePermissionsCommand) {
    if (command.targetOrganizationId) {
      const org = await this.organizationRepository.findOne({
        where: { id: command.targetOrganizationId },
      });
      if (!org) throw new NotFoundException('Organization not found');

      const defaultRole = await this.roleRepository.findDefaultRole(
        command.targetOrganizationId,
      );
      if (!defaultRole) {
        return { updated: 0, organizations: 1 };
      }

      defaultRole.permissions = ALL_PERMISSIONS;
      await this.roleRepository.save(defaultRole);
      return { updated: 1, organizations: 1 };
    }

    const defaultRoles = await this.roleRepository.find({
      where: { isDefault: true },
    });

    const orgIds = new Set(defaultRoles.map((r) => r.organizationId));

    for (const role of defaultRoles) {
      role.permissions = ALL_PERMISSIONS;
    }

    await this.roleRepository.save(defaultRoles);

    return { updated: defaultRoles.length, organizations: orgIds.size };
  }
}
