import type { BillingInterval, PlanId } from '@boilerplate/core';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export enum ProviderSubscriptionStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export interface PlanSelection {
  plan: PlanId;
  interval: BillingInterval;
}

export interface ProviderSubscription {
  subscriptionId: string;
  customerId: string | null;
  status: ProviderSubscriptionStatus;
  selection: PlanSelection | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  cancelAtPeriodEnd: boolean;
  organizationId: string | null;
}

export interface ProviderWebhookEvent {
  id: string;
  type: string;
  subscription: ProviderSubscription | null;
}

export interface ProviderWebhookRequest {
  rawBody: string;
  headers: Record<string, string | undefined>;
}

export interface CreateCheckoutParams {
  selection: PlanSelection;
  customerId: string | null;
  email: string;
  name: string;
  returnUrl: string;
  trialPeriodDays: number | null;
  organizationId: string;
  userId: string;
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  isAvailable(selection: PlanSelection): boolean;
  createCheckout(params: CreateCheckoutParams): Promise<string>;
  changePlan(subscriptionId: string, selection: PlanSelection): Promise<void>;
  setCancelAtPeriodEnd(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<void>;
  createPortalLink(customerId: string, returnUrl: string): Promise<string>;
  getSubscription(subscriptionId: string): Promise<ProviderSubscription>;
  parseWebhook(request: ProviderWebhookRequest): ProviderWebhookEvent;
}
