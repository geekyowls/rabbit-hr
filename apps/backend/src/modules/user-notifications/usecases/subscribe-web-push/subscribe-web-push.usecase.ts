import { Injectable } from '@nestjs/common';
import { WebPushSubscriptionRepository } from '@db/repositories';
import { SubscribeWebPushCommand } from './subscribe-web-push.command';

@Injectable()
export class SubscribeWebPush {
  constructor(
    private readonly subscriptionRepository: WebPushSubscriptionRepository,
  ) {}

  async execute(command: SubscribeWebPushCommand): Promise<{ success: true }> {
    await this.subscriptionRepository.upsertSubscription({
      organizationId: command.organizationId,
      userId: command.userId,
      endpoint: command.endpoint,
      p256dh: command.p256dh,
      auth: command.auth,
      userAgent: command.userAgent ?? null,
    });
    return { success: true };
  }
}
