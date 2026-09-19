import { Injectable } from '@nestjs/common';
import { NotificationDispatcher } from '../../services/notification-dispatcher.service';
import { SendTestNotificationCommand } from './send-test-notification.command';

@Injectable()
export class SendTestNotification {
  constructor(private readonly dispatcher: NotificationDispatcher) {}

  async execute(
    command: SendTestNotificationCommand,
  ): Promise<{ success: true }> {
    await this.dispatcher.dispatch({
      organizationId: command.organizationId,
      recipientUserIds: [command.userId],
      type: 'dev.test',
      title: 'Test notification',
      body: 'If you can see this, your notifications are working end to end.',
      link: '/dashboard',
      priority: 'info',
    });
    return { success: true };
  }
}
