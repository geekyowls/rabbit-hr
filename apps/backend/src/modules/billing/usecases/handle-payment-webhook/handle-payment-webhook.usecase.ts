import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BillingWebhookEventRepository } from '@db/repositories';
import { ContextLogger } from '@shared/framework/context-logger';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../services/payment-provider.interface';
import { SubscriptionSyncService } from '../../services/subscription-sync.service';
import { HandlePaymentWebhookCommand } from './handle-payment-webhook.command';

const UNIQUE_VIOLATION = '23505';

export interface WebhookReceipt {
  received: boolean;
  duplicate: boolean;
}

@Injectable()
export class HandlePaymentWebhook {
  private readonly logger = new ContextLogger(HandlePaymentWebhook.name);

  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly subscriptionSync: SubscriptionSyncService,
    private readonly webhookEventRepository: BillingWebhookEventRepository,
  ) {}

  async execute(command: HandlePaymentWebhookCommand): Promise<WebhookReceipt> {
    const event = this.provider.parseWebhook({
      rawBody: command.rawBody,
      headers: command.headers,
    });
    if (!event.id) throw new BadRequestException('Missing webhook id');
    const alreadyProcessed = await this.webhookEventRepository.exists({
      where: { provider: this.provider.name, webhookId: event.id },
    });
    if (alreadyProcessed) {
      this.logger.log(`Duplicate ${this.provider.name} webhook ${event.id}`);
      return { received: true, duplicate: true };
    }

    const organizationId = event.subscription
      ? await this.subscriptionSync.apply(event.type, event.subscription)
      : null;

    try {
      await this.webhookEventRepository.insert({
        provider: this.provider.name,
        webhookId: event.id,
        eventType: event.type,
        organizationId,
      });
    } catch (error) {
      if ((error as { code?: string }).code !== UNIQUE_VIOLATION) throw error;
      return { received: true, duplicate: true };
    }
    return { received: true, duplicate: false };
  }
}
