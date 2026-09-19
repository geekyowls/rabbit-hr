import type { NotificationPriority } from '@db/entities';

export interface NotificationDelivery {
  organizationId: string;
  recipientUserIds: string[];
  type: string;
  title: string;
  body: string;
  link: string | null;
  priority: NotificationPriority;
  data: Record<string, unknown> | null;
}

export interface NotificationChannel {
  readonly name: string;
  deliver(delivery: NotificationDelivery): Promise<void>;
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
