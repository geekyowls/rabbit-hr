export enum OrgSubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  GRACE = 'grace',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

export enum PlanId {
  FREE = 'free',
  STARTER = 'starter',
  GROWTH = 'growth',
  SCALE = 'scale',
  ENTERPRISE = 'enterprise',
}

export enum PlanFeature {
  INBOX = 'inbox',
  OFFER_ESIGN = 'offerEsign',
  CANDIDATE_PORTAL = 'candidatePortal',
  CALLS = 'calls',
  WHATSAPP = 'whatsapp',
  CALENDAR_SYNC = 'calendarSync',
  JOB_FEED = 'jobFeed',
  ADVANCED_REPORTS = 'advancedReports',
  CUSTOM_ROLES = 'customRoles',
  CUSTOM_FIELDS = 'customFields',
  AUDIT_LOG = 'auditLog',
}

export enum BillingAccess {
  FULL = 'full',
  READ_ONLY = 'read_only',
  NEEDS_PLAN = 'needs_plan',
}

export const BILLING_ERROR_CODES = {
  PLAN_UPGRADE_REQUIRED: 'PLAN_UPGRADE_REQUIRED',
  BILLING_READ_ONLY: 'BILLING_READ_ONLY',
  BILLING_NEEDS_PLAN: 'BILLING_NEEDS_PLAN',
  MEMBER_LIMIT_REACHED: 'MEMBER_LIMIT_REACHED',
  ACTIVE_JOB_LIMIT_REACHED: 'ACTIVE_JOB_LIMIT_REACHED',
} as const;

export type BillingErrorCode =
  (typeof BILLING_ERROR_CODES)[keyof typeof BILLING_ERROR_CODES];

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  memberLimit: number | null;
  activeJobLimit: number | null;
  features: PlanFeature[];
  selfServe: boolean;
}

export const TRIAL_PERIOD_DAYS = 14;
export const PAST_DUE_GRACE_DAYS = 7;

export const ACTIVE_JOB_STATUSES = ['published', 'on_hold'] as const;

const STARTER_FEATURES: PlanFeature[] = [
  PlanFeature.INBOX,
  PlanFeature.OFFER_ESIGN,
  PlanFeature.CANDIDATE_PORTAL,
];
const GROWTH_FEATURES: PlanFeature[] = Object.values(PlanFeature);

export const PLANS: Record<PlanId, PlanDefinition> = {
  [PlanId.FREE]: {
    id: PlanId.FREE,
    name: 'Free',
    description: 'Core ATS for a solo recruiter',
    monthlyPrice: 0,
    yearlyPrice: 0,
    memberLimit: 1,
    activeJobLimit: 3,
    features: [],
    selfServe: false,
  },
  [PlanId.STARTER]: {
    id: PlanId.STARTER,
    name: 'Starter',
    description: 'For small agencies getting started',
    monthlyPrice: 99,
    yearlyPrice: 990,
    memberLimit: 5,
    activeJobLimit: null,
    features: STARTER_FEATURES,
    selfServe: true,
  },
  [PlanId.GROWTH]: {
    id: PlanId.GROWTH,
    name: 'Growth',
    description: 'Calls, WhatsApp, calendar sync and advanced reports',
    monthlyPrice: 249,
    yearlyPrice: 2490,
    memberLimit: 15,
    activeJobLimit: null,
    features: GROWTH_FEATURES,
    selfServe: true,
  },
  [PlanId.SCALE]: {
    id: PlanId.SCALE,
    name: 'Scale',
    description: 'Everything in Growth for larger teams',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    memberLimit: 40,
    activeJobLimit: null,
    features: GROWTH_FEATURES,
    selfServe: true,
  },
  [PlanId.ENTERPRISE]: {
    id: PlanId.ENTERPRISE,
    name: 'Enterprise',
    description: 'Custom limits, onboarding and terms',
    monthlyPrice: null,
    yearlyPrice: null,
    memberLimit: null,
    activeJobLimit: null,
    features: GROWTH_FEATURES,
    selfServe: false,
  },
};

export const SELF_SERVE_PLAN_IDS: PlanId[] = Object.values(PLANS)
  .filter((plan) => plan.selfServe)
  .map((plan) => plan.id);

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  [PlanFeature.INBOX]: 'Shared email inbox',
  [PlanFeature.OFFER_ESIGN]: 'Offer e-signature',
  [PlanFeature.CANDIDATE_PORTAL]: 'Candidate portal',
  [PlanFeature.CALLS]: 'Calls',
  [PlanFeature.WHATSAPP]: 'WhatsApp',
  [PlanFeature.CALENDAR_SYNC]: 'Calendar sync and meeting links',
  [PlanFeature.JOB_FEED]: 'Job board feed',
  [PlanFeature.ADVANCED_REPORTS]: 'Advanced reports',
  [PlanFeature.CUSTOM_ROLES]: 'Custom roles',
  [PlanFeature.CUSTOM_FIELDS]: 'Custom fields',
  [PlanFeature.AUDIT_LOG]: 'Audit log',
};

export const BILLING_DODO_PRODUCT_ENV: Record<
  string,
  { plan: PlanId; interval: BillingInterval }
> = {
  DODO_PRODUCT_STARTER_MONTHLY: {
    plan: PlanId.STARTER,
    interval: BillingInterval.MONTH,
  },
  DODO_PRODUCT_STARTER_YEARLY: {
    plan: PlanId.STARTER,
    interval: BillingInterval.YEAR,
  },
  DODO_PRODUCT_GROWTH_MONTHLY: {
    plan: PlanId.GROWTH,
    interval: BillingInterval.MONTH,
  },
  DODO_PRODUCT_GROWTH_YEARLY: {
    plan: PlanId.GROWTH,
    interval: BillingInterval.YEAR,
  },
  DODO_PRODUCT_SCALE_MONTHLY: {
    plan: PlanId.SCALE,
    interval: BillingInterval.MONTH,
  },
  DODO_PRODUCT_SCALE_YEARLY: {
    plan: PlanId.SCALE,
    interval: BillingInterval.YEAR,
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return Object.values(PlanId).includes(value as PlanId);
}

export function getPlan(
  planId: string | null | undefined,
): PlanDefinition | null {
  return isPlanId(planId) ? PLANS[planId] : null;
}

export function planHasFeature(
  planId: string | null | undefined,
  feature: PlanFeature,
): boolean {
  return getPlan(planId)?.features.includes(feature) ?? false;
}

export function isPaidPlan(planId: string | null | undefined): boolean {
  return isPlanId(planId) && planId !== PlanId.FREE;
}

export function getPlanActiveJobLimit(
  planId: string | null | undefined,
): number | null {
  return getPlan(planId)?.activeJobLimit ?? null;
}

export function getPlanMemberLimit(
  planId: string | null | undefined,
  override?: number | null,
): number | null {
  if (override && override > 0) return override;
  return getPlan(planId)?.memberLimit ?? null;
}

export function getPlanPrice(
  planId: PlanId,
  interval: BillingInterval,
): number | null {
  const plan = PLANS[planId];
  return interval === BillingInterval.YEAR
    ? plan.yearlyPrice
    : plan.monthlyPrice;
}

export function getLowestPlanWithFeature(feature: PlanFeature): PlanDefinition {
  return (
    SELF_SERVE_PLAN_IDS.map((id) => PLANS[id]).find((plan) =>
      plan.features.includes(feature),
    ) ?? PLANS[PlanId.ENTERPRISE]
  );
}

export function parseBillingInterval(
  value: string | null | undefined,
): BillingInterval | null {
  const normalized = (value ?? '').toLowerCase();
  if (['year', 'yearly', 'annual', 'annually'].includes(normalized)) {
    return BillingInterval.YEAR;
  }
  if (['month', 'monthly'].includes(normalized)) {
    return BillingInterval.MONTH;
  }
  return null;
}

export interface BillingAccessInput {
  plan: string | null;
  status: OrgSubscriptionStatus | string;
  trialEndsAt: Date | string | null;
  subscriptionEndsAt: Date | string | null;
  pastDueSince: Date | string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toTime(value: Date | string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function resolveEffectivePlan(
  input: BillingAccessInput,
  now: Date = new Date(),
): PlanId | null {
  if (!isPlanId(input.plan)) return null;
  if (input.plan === PlanId.FREE) return PlanId.FREE;
  const current = now.getTime();
  const trialEnd = toTime(input.trialEndsAt);
  const periodEnd = toTime(input.subscriptionEndsAt);
  switch (input.status) {
    case OrgSubscriptionStatus.ACTIVE:
    case OrgSubscriptionStatus.GRACE:
    case OrgSubscriptionStatus.PAST_DUE:
      return input.plan;
    case OrgSubscriptionStatus.TRIAL:
      return trialEnd === null || trialEnd > current ? input.plan : PlanId.FREE;
    case OrgSubscriptionStatus.CANCELLED:
      return periodEnd !== null && periodEnd > current
        ? input.plan
        : PlanId.FREE;
    default:
      return PlanId.FREE;
  }
}

export function resolveBillingAccess(
  input: BillingAccessInput,
  now: Date = new Date(),
): BillingAccess {
  if (!isPlanId(input.plan)) return BillingAccess.NEEDS_PLAN;
  if (resolveEffectivePlan(input, now) === PlanId.FREE) {
    return BillingAccess.FULL;
  }
  const pastDueSince = toTime(input.pastDueSince);
  if (
    input.status === OrgSubscriptionStatus.PAST_DUE &&
    pastDueSince !== null &&
    pastDueSince + PAST_DUE_GRACE_DAYS * DAY_MS <= now.getTime()
  ) {
    return BillingAccess.READ_ONLY;
  }
  return BillingAccess.FULL;
}

export function daysUntil(
  value: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  const time = toTime(value ?? null);
  if (time === null) return null;
  return Math.max(0, Math.ceil((time - now.getTime()) / DAY_MS));
}
