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
  CandidateDetail,
  CandidateListItem,
  CreateCandidateRequest,
  ListCandidatesRequest,
  UpdateCandidateRequest,
} from '@/types/candidate.type';
import { activitiesKeys } from './use-activities-query';
import { applicationsKeys } from './use-applications-query';
import { atsDashboardKeys } from './use-ats-dashboard-query';
import { jobsKeys } from './use-jobs-query';

export const candidatesKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidatesKeys.all, 'list'] as const,
  list: (params: ListCandidatesRequest) =>
    [...candidatesKeys.lists(), params] as const,
  details: () => [...candidatesKeys.all, 'detail'] as const,
  detail: (id: string) => [...candidatesKeys.details(), id] as const,
};

export function useCandidatesQuery(
  params: ListCandidatesRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: candidatesKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<CandidateListItem>>(
        API_ROUTES.CANDIDATES.LIST,
        { method: 'POST', body: JSON.stringify(params) },
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCandidateQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: candidatesKeys.detail(id ?? ''),
    queryFn: () => fetchApi<CandidateDetail>(API_ROUTES.CANDIDATES.GET(id!)),
    enabled: !!id,
  });
}

export function useCreateCandidateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCandidateRequest) =>
      fetchApi<CandidateDetail>(API_ROUTES.CANDIDATES.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (candidate) => {
      qc.setQueryData(candidatesKeys.detail(candidate.id), candidate);
      qc.invalidateQueries({ queryKey: candidatesKeys.lists() });
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
      qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
    },
  });
}

export function useUpdateCandidateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCandidateRequest }) =>
      fetchApi<CandidateDetail>(API_ROUTES.CANDIDATES.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (candidate) => {
      qc.setQueryData(candidatesKeys.detail(candidate.id), candidate);
      qc.invalidateQueries({ queryKey: candidatesKeys.lists() });
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
    },
  });
}

export function useDeleteCandidateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.CANDIDATES.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: candidatesKeys.detail(id) });
      qc.invalidateQueries({ queryKey: candidatesKeys.lists() });
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: jobsKeys.all });
      qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
    },
  });
}
