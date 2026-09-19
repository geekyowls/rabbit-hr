import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@db/repositories';
import { MarkNotificationReadCommand } from './mark-notification-read.command';

@Injectable()
export class MarkNotificationRead {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    command: MarkNotificationReadCommand,
  ): Promise<{ success: true }> {
    await this.notificationRepository.markRead(
      command.notificationId,
      command.organizationId,
      command.userId,
    );
    return { success: true };
  }
}
