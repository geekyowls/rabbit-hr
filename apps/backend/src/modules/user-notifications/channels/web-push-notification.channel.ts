import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationDelivery,
} from './notification-channel.interface';
import { WebPushService } from '../services/web-push.service';

@Injectable()
export class WebPushNotificationChannel implements NotificationChannel {
  readonly name = 'web-push';

  constructor(private readonly webPushService: WebPushService) {}

  async deliver(delivery: NotificationDelivery): Promise<void> {
    await Promise.all(
      delivery.recipientUserIds.map((userId) =>
        this.webPushService.sendToUser(delivery.organizationId, userId, {
          title: delivery.title,
          body: delivery.body,
          url: delivery.link ?? '/dashboard',
          icon: '/logo-icon.png',
        }),
      ),
    );
  }
}
