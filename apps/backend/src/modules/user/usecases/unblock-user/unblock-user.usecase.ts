import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { UserStatus } from '@db/enums';
import { EventName, UserUnblockedEvent } from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';
import { UnblockUserCommand } from './unblock-user.command';

@Injectable()
export class UnblockUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: AppEventEmitter,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async execute(command: UnblockUserCommand) {
    // Find user
    const user = await this.userRepository.findOne({
      where: { id: command.userId, organizationId: command.organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.BLOCKED) {
      await this.entitlements.assertMemberCapacity(command.organizationId);
    }

    // Update status
    user.status = UserStatus.ACTIVE;
    user.isActive = true;

    await this.userRepository.save(user);

    this.eventEmitter.emit<UserUnblockedEvent>({
      eventName: EventName.USER_UNBLOCKED,
      timestamp: new Date(),
      userId: user.id,
      organizationId: command.organizationId,
      unblockedBy: command.currentUserId,
      triggeredBy: command.currentUserId,
    });

    return { success: true };
  }
}
