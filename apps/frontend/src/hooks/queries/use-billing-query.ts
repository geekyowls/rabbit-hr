import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BillingAccess, type PlanFeature } from '@boilerplate/shared';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { integrationCapabilitiesKeys } from './use-integration-capabilities-query';
import type {
  BillingRedirect,
  BillingSummary,
  CheckoutOption,
} from '@/types/billing.type';

export const billingKeys = {
  all: ['billing'] as const,
  summary: () => [...billingKeys.all, 'summary'] as const,
};

export function useBillingSummary(enabled: boolean = true) {
  return useQuery({
    queryKey: billingKeys.summary(),
    queryFn: () => fetchApi<BillingSummary>(API_ROUTES.BILLING.SUMMARY),
    staleTime: 60_000,
    enabled,
  });
}

export function usePlanFeature(feature: PlanFeature | null) {
  const { data, isLoading } = useBillingSummary();
  return {
    isLoading,
    hasFeature:
      !feature || !data || !data.enforced || data.features.includes(feature),
  };
}

export function useIsReadOnly(): boolean {
  const { data } = useBillingSummary();
  return !!data?.enforced && data.access !== BillingAccess.FULL;
}

export function isCheckoutAvailable(
  summary: BillingSummary | undefined,
  option: CheckoutOption,
): boolean {
  return !!summary?.checkoutOptions.some(
    (o) => o.plan === option.plan && o.interval === option.interval,
  );
}

function useBillingSummaryMutation<TVariables>(
  request: (variables: TVariables) => Promise<BillingSummary>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (summary) => {
      qc.setQueryData(billingKeys.summary(), summary);
      qc.invalidateQueries({ queryKey: integrationCapabilitiesKeys.all });
    },
  });
}

export function useCheckoutMutation() {
  return useMutation({
    mutationFn: (option: CheckoutOption) =>
      fetchApi<BillingRedirect>(API_ROUTES.BILLING.CHECKOUT, {
        method: 'POST',
        body: JSON.stringify(option),
      }),
  });
}

export function usePortalMutation() {
  return useMutation({
    mutationFn: () =>
      fetchApi<BillingRedirect>(API_ROUTES.BILLING.PORTAL, { method: 'POST' }),
  });
}

export function useChangePlanMutation() {
  return useBillingSummaryMutation((option: CheckoutOption) =>
    fetchApi<BillingSummary>(API_ROUTES.BILLING.CHANGE_PLAN, {
      method: 'POST',
      body: JSON.stringify(option),
    }),
  );
}

export function useCancelSubscriptionMutation() {
  return useBillingSummaryMutation(() =>
    fetchApi<BillingSummary>(API_ROUTES.BILLING.CANCEL, { method: 'POST' }),
  );
}

export function useResumeSubscriptionMutation() {
  return useBillingSummaryMutation(() =>
    fetchApi<BillingSummary>(API_ROUTES.BILLING.RESUME, { method: 'POST' }),
  );
}

export function useSyncSubscriptionMutation() {
  return useBillingSummaryMutation((subscriptionId: string) =>
    fetchApi<BillingSummary>(API_ROUTES.BILLING.SYNC, {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    }),
  );
}
