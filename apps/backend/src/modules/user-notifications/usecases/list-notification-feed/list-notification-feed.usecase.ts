import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@db/repositories';
import type { NotificationPriority } from '@db/entities';
import { ListNotificationFeedCommand } from './list-notification-feed.command';

export interface NotificationFeedItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationFeedResponse {
  items: NotificationFeedItem[];
  unreadCount: number;
}

@Injectable()
export class ListNotificationFeed {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    command: ListNotificationFeedCommand,
  ): Promise<NotificationFeedResponse> {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findFeedForUser(
        command.organizationId,
        command.userId,
      ),
      this.notificationRepository.countUnread(
        command.organizationId,
        command.userId,
      ),
    ]);

    return {
      items: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        priority: n.priority,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  }
}
