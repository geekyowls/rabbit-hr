import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '@db/repositories';
import { RoleEntity } from '@db/entities';

@Injectable()
export class GetRole {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(roleId: string, organizationId: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findById(roleId);
    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }
}
