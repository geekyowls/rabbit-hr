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
  CandidateCall,
  InitiateCallRequest,
  ListCandidateCallsParams,
  UpdateCallRequest,
} from '@/types/call.type';
import { activitiesKeys } from './use-activities-query';

export const callsKeys = {
  all: ['calls'] as const,
  candidate: (candidateId: string) =>
    [...callsKeys.all, 'candidate', candidateId] as const,
  list: (candidateId: string, params: ListCandidateCallsParams) =>
    [...callsKeys.candidate(candidateId), params] as const,
};

export function useCandidateCallsQuery(
  candidateId: string | null | undefined,
  params: ListCandidateCallsParams = { page: 1, limit: 10 },
) {
  return useQuery({
    queryKey: callsKeys.list(candidateId ?? '', params),
    queryFn: () =>
      fetchApi<PaginatedResponse<CandidateCall>>(
        API_ROUTES.CALLS.LIST(
          candidateId!,
          new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
          }).toString(),
        ),
      ),
    placeholderData: keepPreviousData,
    enabled: !!candidateId,
  });
}

export function useInitiateCallMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      candidateId,
      data,
    }: {
      candidateId: string;
      data: InitiateCallRequest;
    }) =>
      fetchApi<CandidateCall>(API_ROUTES.CALLS.INITIATE(candidateId), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSettled: (_call, _error, { candidateId }) =>
      qc.invalidateQueries({ queryKey: callsKeys.candidate(candidateId) }),
  });
}

export function useUpdateCallMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCallRequest }) =>
      fetchApi<CandidateCall>(API_ROUTES.CALLS.UPDATE(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (call) => {
      qc.invalidateQueries({ queryKey: callsKeys.candidate(call.candidateId) });
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    },
  });
}
