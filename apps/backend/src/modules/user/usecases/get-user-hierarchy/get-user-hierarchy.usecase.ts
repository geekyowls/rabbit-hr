import { Injectable } from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { GetUserHierarchyCommand } from './get-user-hierarchy.command';

@Injectable()
export class GetUserHierarchy {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: GetUserHierarchyCommand) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.managerId',
        'user.status',
      ])
      .addSelect(['role.id', 'role.name'])
      .where('user.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      managerId: user.managerId,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      status: user.status,
    }));
  }
}
