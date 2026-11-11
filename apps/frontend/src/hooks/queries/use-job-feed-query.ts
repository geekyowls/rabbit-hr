import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  JobFeedSettings,
  UpdateJobFeedSettingsRequest,
} from '@/types/job-feed.type';

export const jobFeedKeys = {
  all: ['job-feed'] as const,
  settings: () => [...jobFeedKeys.all, 'settings'] as const,
};

export function useJobFeedSettingsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: jobFeedKeys.settings(),
    queryFn: () => fetchApi<JobFeedSettings>(API_ROUTES.JOB_FEED.SETTINGS),
    enabled,
  });
}

export function useUpdateJobFeedSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateJobFeedSettingsRequest) =>
      fetchApi<JobFeedSettings>(API_ROUTES.JOB_FEED.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (settings) => qc.setQueryData(jobFeedKeys.settings(), settings),
  });
}
