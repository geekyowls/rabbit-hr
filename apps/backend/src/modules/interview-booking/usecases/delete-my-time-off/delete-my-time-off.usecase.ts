import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTimeOffRepository } from '@db/repositories';
import { DeleteMyTimeOffCommand } from './delete-my-time-off.command';

@Injectable()
export class DeleteMyTimeOff {
  constructor(private readonly timeOffRepository: UserTimeOffRepository) {}

  async execute(
    command: DeleteMyTimeOffCommand,
  ): Promise<{ success: boolean }> {
    const result = await this.timeOffRepository.delete({
      id: command.timeOffId,
      organizationId: command.organizationId,
      userId: command.userId,
    });
    if (!result.affected) {
      throw new NotFoundException('Time off not found');
    }
    return { success: true };
  }
}
