import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { CompleteTourCommand } from './complete-tour.command';

@Injectable()
export class CompleteTour {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    command: CompleteTourCommand,
  ): Promise<{ tourCompleted: boolean }> {
    const user = await this.userRepository.findOne({
      where: {
        id: command.userId,
        organizationId: command.organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.tourCompleted = true;
    await this.userRepository.save(user);

    return { tourCompleted: true };
  }
}
