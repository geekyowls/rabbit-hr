export type NotificationPriority = 'info' | 'warning' | 'critical';

export interface NotificationFeedItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFeedResponse {
  items: NotificationFeedItem[];
  unreadCount: number;
}
