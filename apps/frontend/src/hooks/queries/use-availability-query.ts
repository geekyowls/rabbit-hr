import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  InterviewerAvailability,
  ListTimeOffParams,
  TimeOff,
  TimeOffRequest,
  UpdateAvailabilityRequest,
} from '@/types/availability.type';

export const availabilityKeys = {
  all: ['availability'] as const,
  me: () => [...availabilityKeys.all, 'me'] as const,
  timeOff: (params: ListTimeOffParams) =>
    [...availabilityKeys.all, 'time-off', params] as const,
};

function toQuery(params: ListTimeOffParams): string {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  return search.toString();
}

export function useMyAvailabilityQuery() {
  return useQuery({
    queryKey: availabilityKeys.me(),
    queryFn: () =>
      fetchApi<InterviewerAvailability>(API_ROUTES.AVAILABILITY.ME),
  });
}

export function useUpdateMyAvailabilityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAvailabilityRequest) =>
      fetchApi<InterviewerAvailability>(API_ROUTES.AVAILABILITY.ME, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (availability) => {
      qc.setQueryData(availabilityKeys.me(), availability);
    },
  });
}

export function useMyTimeOffQuery(params: ListTimeOffParams = {}) {
  return useQuery({
    queryKey: availabilityKeys.timeOff(params),
    queryFn: () =>
      fetchApi<TimeOff[]>(API_ROUTES.AVAILABILITY.TIME_OFF(toQuery(params))),
  });
}

function useInvalidateTimeOff() {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ queryKey: [...availabilityKeys.all, 'time-off'] });
}

export function useCreateTimeOffMutation() {
  const invalidate = useInvalidateTimeOff();
  return useMutation({
    mutationFn: (data: TimeOffRequest) =>
      fetchApi<TimeOff>(API_ROUTES.AVAILABILITY.TIME_OFF(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateTimeOffMutation() {
  const invalidate = useInvalidateTimeOff();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimeOffRequest }) =>
      fetchApi<TimeOff>(API_ROUTES.AVAILABILITY.TIME_OFF_ITEM(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteTimeOffMutation() {
  const invalidate = useInvalidateTimeOff();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(
        API_ROUTES.AVAILABILITY.TIME_OFF_ITEM(id),
        {
          method: 'DELETE',
        },
      ),
    onSuccess: invalidate,
  });
}
