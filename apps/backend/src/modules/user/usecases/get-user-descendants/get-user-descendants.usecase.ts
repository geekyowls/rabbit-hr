import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { GetUserDescendantsCommand } from './get-user-descendants.command';

@Injectable()
export class GetUserDescendants {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: GetUserDescendantsCommand): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: {
        id: command.targetUserId,
        organizationId: command.organizationId,
      },
      select: ['id', 'path'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userPath = user.path || `/${command.targetUserId}/`;

    const descendants = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .where('user.path LIKE :pathPattern', {
        pathPattern: `${userPath}%`,
      })
      .andWhere('user.id != :userId', { userId: command.targetUserId })
      .andWhere('user.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .getMany();

    return descendants.map((d) => d.id);
  }
}
