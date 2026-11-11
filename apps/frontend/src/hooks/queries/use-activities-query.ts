import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  Activity,
  CreateActivityRequest,
  ListActivitiesRequest,
} from '@/types/activity.type';
import { atsDashboardKeys } from './use-ats-dashboard-query';

export const activitiesKeys = {
  all: ['activities'] as const,
  lists: () => [...activitiesKeys.all, 'list'] as const,
  list: (params: ListActivitiesRequest) =>
    [...activitiesKeys.lists(), params] as const,
};

export function useActivitiesQuery(
  params: ListActivitiesRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: activitiesKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<Activity>>(API_ROUTES.ACTIVITIES.LIST, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateActivityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityRequest) =>
      fetchApi<Activity>(API_ROUTES.ACTIVITIES.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
      qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
    },
  });
}
