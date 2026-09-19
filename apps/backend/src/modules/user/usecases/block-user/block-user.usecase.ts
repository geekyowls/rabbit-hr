import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { UserStatus } from '@db/enums';
import { EventName, UserBlockedEvent } from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { BlockUserCommand } from './block-user.command';

@Injectable()
export class BlockUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: BlockUserCommand) {
    // Cannot block self
    if (command.userId === command.currentUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: command.userId, organizationId: command.organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update status
    user.status = UserStatus.BLOCKED;
    user.isActive = false;

    await this.userRepository.save(user);

    this.eventEmitter.emit<UserBlockedEvent>({
      eventName: EventName.USER_BLOCKED,
      timestamp: new Date(),
      userId: user.id,
      organizationId: command.organizationId,
      blockedBy: command.currentUserId,
      triggeredBy: command.currentUserId,
    });

    return { success: true };
  }
}
