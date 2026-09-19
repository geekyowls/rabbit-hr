import { Injectable } from '@nestjs/common';
import { RoleRepository } from '@db/repositories';
import { RoleEntity } from '@db/entities';
import { ListRolesCommand } from './list-roles.command';

@Injectable()
export class ListRoles {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(command: ListRolesCommand): Promise<RoleEntity[]> {
    return this.roleRepository.findByOrganizationId(command.organizationId);
  }
}
