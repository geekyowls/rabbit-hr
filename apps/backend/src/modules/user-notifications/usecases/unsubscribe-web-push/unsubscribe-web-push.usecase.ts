import { Injectable } from '@nestjs/common';
import { WebPushSubscriptionRepository } from '@db/repositories';
import { UnsubscribeWebPushCommand } from './unsubscribe-web-push.command';

@Injectable()
export class UnsubscribeWebPush {
  constructor(
    private readonly subscriptionRepository: WebPushSubscriptionRepository,
  ) {}

  async execute(
    command: UnsubscribeWebPushCommand,
  ): Promise<{ success: true }> {
    await this.subscriptionRepository.deleteForUser(
      command.endpoint,
      command.organizationId,
      command.userId,
    );
    return { success: true };
  }
}
