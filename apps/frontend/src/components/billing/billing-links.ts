import {
  BillingInterval,
  isPlanId,
  parseBillingInterval,
  PlanId,
  SELF_SERVE_PLAN_IDS,
} from '@boilerplate/shared';

export const BILLING_SETTINGS_PATH = '/dashboard/settings/billing';
export const CHOOSE_PLAN_PATH = '/dashboard/billing/choose';
export const CONTACT_SALES_URL = 'https://rabbithr.co/demo';

const PLAN_INTENT_KEY = 'rabbithr:plan-intent';

export interface PlanIntent {
  plan: PlanId | null;
  interval: BillingInterval | null;
}

export function parsePlanIntent(
  plan: string | null,
  billing: string | null,
): PlanIntent {
  return {
    plan: isPlanId(plan) && SELF_SERVE_PLAN_IDS.includes(plan) ? plan : null,
    interval: parseBillingInterval(billing),
  };
}

export function savePlanIntent(intent: PlanIntent): void {
  if (!intent.plan && !intent.interval) return;
  try {
    sessionStorage.setItem(PLAN_INTENT_KEY, JSON.stringify(intent));
  } catch {
    return;
  }
}

export function readPlanIntent(): PlanIntent {
  try {
    const raw = sessionStorage.getItem(PLAN_INTENT_KEY);
    if (!raw) return { plan: null, interval: null };
    const stored = JSON.parse(raw) as { plan?: string; interval?: string };
    return parsePlanIntent(stored.plan ?? null, stored.interval ?? null);
  } catch {
    return { plan: null, interval: null };
  }
}

export function choosePlanHref(intent: PlanIntent): string {
  const params = new URLSearchParams();
  if (intent.plan) params.set('plan', intent.plan);
  if (intent.interval) params.set('billing', intent.interval);
  const query = params.toString();
  return query ? `${CHOOSE_PLAN_PATH}?${query}` : CHOOSE_PLAN_PATH;
}
