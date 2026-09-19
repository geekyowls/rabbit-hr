import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@db/repositories';
import {
  NotificationChannel,
  NotificationDelivery,
} from './notification-channel.interface';

@Injectable()
export class InAppNotificationChannel implements NotificationChannel {
  readonly name = 'in-app';

  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async deliver(delivery: NotificationDelivery): Promise<void> {
    await this.notificationRepository.createMany(
      delivery.recipientUserIds.map((recipientUserId) => ({
        organizationId: delivery.organizationId,
        recipientUserId,
        type: delivery.type,
        title: delivery.title,
        body: delivery.body,
        link: delivery.link,
        priority: delivery.priority,
        data: delivery.data,
        isRead: false,
      })),
    );
  }
}
