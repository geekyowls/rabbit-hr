import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../services/payment-provider.interface';
import { SubscriptionSyncService } from '../../services/subscription-sync.service';
import { GetBillingSummary } from '../get-billing-summary/get-billing-summary.usecase';
import { GetBillingSummaryCommand } from '../get-billing-summary/get-billing-summary.command';
import { BillingSummaryDto } from '../../dtos/billing.dto';
import { SyncSubscriptionCommand } from './sync-subscription.command';

@Injectable()
export class SyncSubscription {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly subscriptionSync: SubscriptionSyncService,
    private readonly getBillingSummary: GetBillingSummary,
  ) {}

  async execute(command: SyncSubscriptionCommand): Promise<BillingSummaryDto> {
    const subscription = await this.provider.getSubscription(
      command.subscriptionId,
    );
    if (subscription.organizationId !== command.organizationId) {
      throw new ForbiddenException('Subscription belongs to another account');
    }
    await this.subscriptionSync.apply('subscription.sync', subscription);
    return this.getBillingSummary.execute(
      GetBillingSummaryCommand.create({
        userId: command.userId,
        organizationId: command.organizationId,
      }),
    );
  }
}
