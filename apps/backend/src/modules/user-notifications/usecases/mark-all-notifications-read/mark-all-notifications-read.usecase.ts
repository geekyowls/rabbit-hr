import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@db/repositories';
import { MarkAllNotificationsReadCommand } from './mark-all-notifications-read.command';

@Injectable()
export class MarkAllNotificationsRead {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    command: MarkAllNotificationsReadCommand,
  ): Promise<{ success: true }> {
    await this.notificationRepository.markAllRead(
      command.organizationId,
      command.userId,
    );
    return { success: true };
  }
}
