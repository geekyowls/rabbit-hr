import {
  BadGatewayException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import DodoPayments from 'dodopayments';
import type { Subscription } from 'dodopayments/resources/subscriptions';
import { BILLING_DODO_PRODUCT_ENV } from '@boilerplate/core';
import { BillingEntitlementsService } from '../core/billing-entitlements.service';
import {
  CreateCheckoutParams,
  PaymentProvider,
  PlanSelection,
  ProviderSubscription,
  ProviderSubscriptionStatus,
  ProviderWebhookEvent,
  ProviderWebhookRequest,
} from './payment-provider.interface';

interface DodoWebhookPayload {
  type: string;
  data: Partial<Subscription> & { payload_type?: string };
}

const STATUS_MAP: Record<string, ProviderSubscriptionStatus> = {
  active: ProviderSubscriptionStatus.ACTIVE,
  on_hold: ProviderSubscriptionStatus.ON_HOLD,
  past_due: ProviderSubscriptionStatus.ON_HOLD,
  paused: ProviderSubscriptionStatus.ON_HOLD,
  failed: ProviderSubscriptionStatus.FAILED,
  cancelled: ProviderSubscriptionStatus.CANCELLED,
  expired: ProviderSubscriptionStatus.EXPIRED,
  pending: ProviderSubscriptionStatus.PENDING,
};

const EVENT_STATUS_MAP: Record<string, ProviderSubscriptionStatus> = {
  'subscription.active': ProviderSubscriptionStatus.ACTIVE,
  'subscription.renewed': ProviderSubscriptionStatus.ACTIVE,
  'subscription.plan_changed': ProviderSubscriptionStatus.ACTIVE,
  'subscription.unpaused': ProviderSubscriptionStatus.ACTIVE,
  'subscription.on_hold': ProviderSubscriptionStatus.ON_HOLD,
  'subscription.past_due': ProviderSubscriptionStatus.ON_HOLD,
  'subscription.paused': ProviderSubscriptionStatus.ON_HOLD,
  'subscription.failed': ProviderSubscriptionStatus.FAILED,
  'subscription.cancelled': ProviderSubscriptionStatus.CANCELLED,
  'subscription.expired': ProviderSubscriptionStatus.EXPIRED,
};

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DodoPaymentsService implements PaymentProvider, OnModuleInit {
  readonly name = 'dodo';
  private readonly logger = new Logger(DodoPaymentsService.name);
  private client: DodoPayments | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn(
        'Dodo Payments is not configured, billing is disabled and not enforced',
      );
    }
  }

  isConfigured(): boolean {
    return this.entitlements.isConfigured();
  }

  isAvailable(selection: PlanSelection): boolean {
    return this.isConfigured() && !!this.productFor(selection);
  }

  async createCheckout(params: CreateCheckoutParams): Promise<string> {
    const session = await this.call(() =>
      this.getClient().checkoutSessions.create({
        product_cart: [
          { product_id: this.requireProduct(params.selection), quantity: 1 },
        ],
        customer: params.customerId
          ? { customer_id: params.customerId }
          : { email: params.email, name: params.name },
        return_url: params.returnUrl,
        metadata: {
          organizationId: params.organizationId,
          userId: params.userId,
          plan: params.selection.plan,
          interval: params.selection.interval,
        },
        subscription_data: params.trialPeriodDays
          ? { trial_period_days: params.trialPeriodDays }
          : undefined,
      }),
    );
    if (!session.checkout_url) {
      throw new ServiceUnavailableException('Checkout could not be started');
    }
    return session.checkout_url;
  }

  async changePlan(
    subscriptionId: string,
    selection: PlanSelection,
  ): Promise<void> {
    const productId = this.requireProduct(selection);
    await this.call(() =>
      this.getClient().subscriptions.changePlan(subscriptionId, {
        product_id: productId,
        quantity: 1,
        proration_billing_mode: 'prorated_immediately',
      }),
    );
  }

  async setCancelAtPeriodEnd(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<void> {
    await this.call(() =>
      this.getClient().subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: cancelAtPeriodEnd,
      }),
    );
  }

  async createPortalLink(
    customerId: string,
    returnUrl: string,
  ): Promise<string> {
    const session = await this.call(() =>
      this.getClient().customers.customerPortal.create(customerId, {
        return_url: returnUrl,
      }),
    );
    return session.link;
  }

  async getSubscription(subscriptionId: string): Promise<ProviderSubscription> {
    const subscription = await this.call(() =>
      this.getClient().subscriptions.retrieve(subscriptionId),
    );
    return this.normalize(subscription, null);
  }

  parseWebhook(request: ProviderWebhookRequest): ProviderWebhookEvent {
    const id = request.headers['webhook-id'] ?? '';
    let payload: DodoWebhookPayload;
    try {
      payload = this.getClient().webhooks.unwrap(request.rawBody, {
        headers: {
          'webhook-id': id,
          'webhook-signature': request.headers['webhook-signature'] ?? '',
          'webhook-timestamp': request.headers['webhook-timestamp'] ?? '',
        },
        key: this.config.getOrThrow<string>('DODO_PAYMENTS_WEBHOOK_SECRET'),
      }) as unknown as DodoWebhookPayload;
    } catch (error) {
      this.logger.warn(
        `Rejected Dodo webhook ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }
    const isSubscription =
      payload.type.startsWith('subscription.') && !!payload.data;
    return {
      id,
      type: payload.type,
      subscription: isSubscription
        ? this.normalize(payload.data, payload.type)
        : null,
    };
  }

  private normalize(
    data: Partial<Subscription>,
    eventType: string | null,
  ): ProviderSubscription {
    const status =
      (data.status && STATUS_MAP[data.status]) ||
      (eventType && EVENT_STATUS_MAP[eventType]) ||
      ProviderSubscriptionStatus.PENDING;
    const organizationId = data.metadata?.organizationId;
    return {
      subscriptionId: data.subscription_id ?? '',
      customerId: data.customer?.customer_id ?? null,
      status,
      selection: this.selectionFor(data.product_id),
      currentPeriodEnd: this.toDate(data.next_billing_date),
      trialEndsAt: this.trialEnd(data),
      cancelledAt: this.toDate(data.cancelled_at),
      cancelAtPeriodEnd: !!data.cancel_at_next_billing_date,
      organizationId:
        typeof organizationId === 'string' ? organizationId : null,
    };
  }

  private productFor(selection: PlanSelection): string | null {
    const key = Object.keys(BILLING_DODO_PRODUCT_ENV).find(
      (envKey) =>
        BILLING_DODO_PRODUCT_ENV[envKey].plan === selection.plan &&
        BILLING_DODO_PRODUCT_ENV[envKey].interval === selection.interval,
    );
    return key ? this.config.get<string>(key) || null : null;
  }

  private requireProduct(selection: PlanSelection): string {
    const productId = this.productFor(selection);
    if (!productId) {
      throw new ServiceUnavailableException(
        'This plan is not available for online checkout',
      );
    }
    return productId;
  }

  private selectionFor(productId: string | undefined): PlanSelection | null {
    if (!productId) return null;
    const key = Object.keys(BILLING_DODO_PRODUCT_ENV).find(
      (envKey) => this.config.get<string>(envKey) === productId,
    );
    return key ? BILLING_DODO_PRODUCT_ENV[key] : null;
  }

  private trialEnd(data: Partial<Subscription>): Date | null {
    const created = this.toDate(data.created_at);
    if (!created || !data.trial_period_days) return null;
    const end = new Date(created.getTime() + data.trial_period_days * DAY_MS);
    return end.getTime() > Date.now() ? end : null;
  }

  private toDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async call<T>(request: () => PromiseLike<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof DodoPayments.APIError)) throw error;
      this.logger.error(`Dodo request failed: ${error.message}`);
      throw new BadGatewayException(
        'The payment provider could not complete the request, try again shortly',
      );
    }
  }

  private getClient(): DodoPayments {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Billing is not configured');
    }
    if (!this.client) {
      this.client = new DodoPayments({
        bearerToken: this.config.getOrThrow<string>('DODO_PAYMENTS_API_KEY'),
        webhookKey: this.config.get<string>('DODO_PAYMENTS_WEBHOOK_SECRET'),
        environment:
          this.config.get<string>('DODO_PAYMENTS_ENVIRONMENT') === 'live_mode'
            ? 'live_mode'
            : 'test_mode',
      });
    }
    return this.client;
  }
}
