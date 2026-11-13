import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BillingController } from './billing.controller';
import { BillingAccessInterceptor } from './billing-access.interceptor';
import { DodoPaymentsService } from './services/dodo-payments.service';
import { SubscriptionSyncService } from './services/subscription-sync.service';
import { GetBillingSummary } from './usecases/get-billing-summary/get-billing-summary.usecase';
import { CreateCheckout } from './usecases/create-checkout/create-checkout.usecase';
import { ChangePlan } from './usecases/change-plan/change-plan.usecase';
import { CreatePortalSession } from './usecases/create-portal-session/create-portal-session.usecase';
import { SetCancelAtPeriodEnd } from './usecases/set-cancel-at-period-end/set-cancel-at-period-end.usecase';
import { SyncSubscription } from './usecases/sync-subscription/sync-subscription.usecase';
import { HandlePaymentWebhook } from './usecases/handle-payment-webhook/handle-payment-webhook.usecase';
import { PAYMENT_PROVIDER } from './services/payment-provider.interface';

const USE_CASES = [
  GetBillingSummary,
  CreateCheckout,
  ChangePlan,
  CreatePortalSession,
  SetCancelAtPeriodEnd,
  SyncSubscription,
  HandlePaymentWebhook,
];

@Module({
  controllers: [BillingController],
  providers: [
    DodoPaymentsService,
    { provide: PAYMENT_PROVIDER, useExisting: DodoPaymentsService },
    SubscriptionSyncService,
    ...USE_CASES,
    { provide: APP_INTERCEPTOR, useClass: BillingAccessInterceptor },
  ],
})
export class BillingModule {}
