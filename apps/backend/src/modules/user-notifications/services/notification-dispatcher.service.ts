import { Inject, Injectable, Logger } from '@nestjs/common';
import type { NotificationPriority } from '@db/entities';
import {
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
  type NotificationDelivery,
} from '../channels/notification-channel.interface';

export interface DispatchNotificationInput {
  organizationId: string;
  recipientUserIds: string[];
  type: string;
  title: string;
  body: string;
  link?: string | null;
  priority?: NotificationPriority;
  data?: Record<string, unknown> | null;
}

export interface ChannelDeliveryResult {
  channel: string;
  ok: boolean;
  error?: string;
}

export interface DispatchResult {
  recipientCount: number;
  channelResults: ChannelDeliveryResult[];
  delivered: boolean;
  failed: boolean;
}

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: NotificationChannel[],
  ) {}

  async dispatch(input: DispatchNotificationInput): Promise<DispatchResult> {
    const recipients = [...new Set(input.recipientUserIds)].filter(Boolean);
    if (recipients.length === 0) {
      return {
        recipientCount: 0,
        channelResults: [],
        delivered: false,
        failed: false,
      };
    }

    const delivery: NotificationDelivery = {
      organizationId: input.organizationId,
      recipientUserIds: recipients,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      priority: input.priority ?? 'info',
      data: input.data ?? null,
    };

    const channelResults = await Promise.all(
      this.channels.map(async (channel): Promise<ChannelDeliveryResult> => {
        try {
          await channel.deliver(delivery);
          return { channel: channel.name, ok: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `notification channel "${channel.name}" failed: ${error}`,
          );
          return { channel: channel.name, ok: false, error };
        }
      }),
    );

    const inApp = channelResults.find((r) => r.channel === 'in-app');
    const delivered = inApp ? inApp.ok : channelResults.some((r) => r.ok);
    return {
      recipientCount: recipients.length,
      channelResults,
      delivered,
      failed: !delivered,
    };
  }
}
