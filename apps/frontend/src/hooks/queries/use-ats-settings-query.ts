import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { useSession } from '@/contexts/session-context';
import {
  DEFAULT_ATS_SETTINGS,
  type AtsSettings,
  type UpdateAtsSettingsRequest,
} from '@/types/ats-settings.type';

export const atsSettingsKeys = {
  all: ['ats-settings'] as const,
  detail: () => [...atsSettingsKeys.all, 'detail'] as const,
};

export function useAtsSettingsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: atsSettingsKeys.detail(),
    queryFn: () => fetchApi<AtsSettings>(API_ROUTES.ATS_SETTINGS.GET),
    enabled,
  });
}

export function useOrganizationAtsSettings(): AtsSettings {
  const { organization } = useSession();
  return organization?.atsSettings ?? DEFAULT_ATS_SETTINGS;
}

export function useUpdateAtsSettingsMutation() {
  const qc = useQueryClient();
  const { organization, setOrganization } = useSession();
  return useMutation({
    mutationFn: (data: UpdateAtsSettingsRequest) =>
      fetchApi<AtsSettings>(API_ROUTES.ATS_SETTINGS.UPDATE, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (settings) => {
      qc.setQueryData(atsSettingsKeys.detail(), settings);
      if (organization) {
        setOrganization({ ...organization, atsSettings: settings });
      }
    },
  });
}
