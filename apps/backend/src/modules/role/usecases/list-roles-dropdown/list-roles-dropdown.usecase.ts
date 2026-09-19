import { Injectable } from '@nestjs/common';
import { RoleRepository } from '@db/repositories';
import { ListRolesDropdownCommand } from './list-roles-dropdown.command';

@Injectable()
export class ListRolesDropdown {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(
    command: ListRolesDropdownCommand,
  ): Promise<Array<{ id: string; name: string }>> {
    return this.roleRepository.findDropdownByOrganizationId(
      command.organizationId,
    );
  }
}
