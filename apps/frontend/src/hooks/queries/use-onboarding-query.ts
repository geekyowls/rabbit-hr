import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  OnboardingChecklist,
  SampleDataResult,
} from '@/types/onboarding.type';

export const onboardingKeys = {
  all: ['onboarding'] as const,
  checklist: () => [...onboardingKeys.all, 'checklist'] as const,
};

export function useOnboardingChecklist(enabled: boolean = true) {
  return useQuery({
    queryKey: onboardingKeys.checklist(),
    queryFn: () =>
      fetchApi<OnboardingChecklist>(API_ROUTES.ONBOARDING.CHECKLIST),
    staleTime: 30_000,
    enabled,
  });
}

export function useDismissOnboardingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<OnboardingChecklist>(API_ROUTES.ONBOARDING.DISMISS, {
        method: 'POST',
      }),
    onSuccess: (checklist) =>
      qc.setQueryData(onboardingKeys.checklist(), checklist),
  });
}

function useSampleDataMutation(method: 'POST' | 'DELETE') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<SampleDataResult>(API_ROUTES.ONBOARDING.SAMPLE_DATA, {
        method,
      }),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useAddSampleDataMutation() {
  return useSampleDataMutation('POST');
}

export function useRemoveSampleDataMutation() {
  return useSampleDataMutation('DELETE');
}
