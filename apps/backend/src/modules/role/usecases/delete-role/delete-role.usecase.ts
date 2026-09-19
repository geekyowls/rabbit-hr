import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleRepository, UserRepository } from '@db/repositories';
import { DeleteRoleCommand } from './delete-role.command';

@Injectable()
export class DeleteRole {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    const role = await this.roleRepository.findById(command.roleId);
    if (!role || role.organizationId !== command.organizationId) {
      throw new NotFoundException('Role not found');
    }

    if (role.isDefault) {
      throw new BadRequestException('Cannot delete the default role');
    }

    const usersWithRole = await this.userRepository.count({
      where: { roleId: command.roleId },
    });
    if (usersWithRole > 0) {
      throw new BadRequestException(
        `Cannot delete role that is assigned to ${usersWithRole} user(s). Reassign them first.`,
      );
    }

    await this.roleRepository.remove(role);
  }
}
