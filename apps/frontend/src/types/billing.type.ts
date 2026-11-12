import type {
  BillingAccess,
  BillingInterval,
  OrgSubscriptionStatus,
  PlanFeature,
  PlanId,
} from '@boilerplate/shared';

export interface CheckoutOption {
  plan: PlanId;
  interval: BillingInterval;
}

export interface BillingSummary {
  configured: boolean;
  enforced: boolean;
  isSystemOrg: boolean;
  plan: PlanId | null;
  billingInterval: BillingInterval | null;
  status: OrgSubscriptionStatus;
  access: BillingAccess;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  pastDueSince: string | null;
  cancelAtPeriodEnd: boolean;
  features: PlanFeature[];
  members: { count: number; limit: number | null };
  hasSubscription: boolean;
  hasCustomer: boolean;
  checkoutOptions: CheckoutOption[];
}

export interface BillingRedirect {
  url: string;
}

export interface UpdateOrganizationBillingRequest {
  plan?: PlanId;
  status?: OrgSubscriptionStatus;
  memberLimitOverride?: number | null;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
}
