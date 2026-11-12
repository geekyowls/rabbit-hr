import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type { AtsDashboard } from '@/types/ats-dashboard.type';

export const atsDashboardKeys = {
  all: ['ats-dashboard'] as const,
  dashboard: () => [...atsDashboardKeys.all, 'dashboard'] as const,
};

export function useAtsDashboardQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: atsDashboardKeys.dashboard(),
    queryFn: () => fetchApi<AtsDashboard>(API_ROUTES.ATS.DASHBOARD),
    enabled,
  });
}
