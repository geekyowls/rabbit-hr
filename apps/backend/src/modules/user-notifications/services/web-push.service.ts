import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { WebPushSubscriptionRepository } from '@db/repositories';

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private enabled = false;
  private publicKey = '';

  constructor(
    private readonly config: ConfigService,
    private readonly subscriptionRepository: WebPushSubscriptionRepository,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:support@rabbithr.co';

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys not configured — web push disabled');
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.publicKey = publicKey;
      this.enabled = true;
    } catch (err) {
      this.logger.error(
        `Invalid VAPID configuration — web push disabled: ${String(err)}`,
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  async sendToUser(
    organizationId: string,
    userId: string,
    payload: WebPushPayload,
  ): Promise<void> {
    if (!this.enabled) return;

    const subscriptions = await this.subscriptionRepository.findByUser(
      organizationId,
      userId,
    );
    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.subscriptionRepository.deleteByEndpoint(sub.endpoint);
          } else {
            this.logger.warn(
              `web push send failed (${statusCode ?? 'unknown'}): ${String(err)}`,
            );
          }
        }
      }),
    );
  }
}
