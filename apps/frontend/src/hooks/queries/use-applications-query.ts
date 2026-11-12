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
  Application,
  ApplicationBoard,
  ApplicationBoardRequest,
  CreateApplicationRequest,
  ListApplicationsRequest,
  UpdateApplicationRequest,
  UpdateApplicationStageRequest,
} from '@/types/application.type';
import { activitiesKeys } from './use-activities-query';
import { atsDashboardKeys } from './use-ats-dashboard-query';
import { candidatesKeys } from './use-candidates-query';
import { jobsKeys } from './use-jobs-query';
import { clientsKeys } from './use-clients-query';

export const applicationsKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationsKeys.all, 'list'] as const,
  list: (params: ListApplicationsRequest) =>
    [...applicationsKeys.lists(), params] as const,
  boards: () => [...applicationsKeys.all, 'board'] as const,
  board: (params: ApplicationBoardRequest) =>
    [...applicationsKeys.boards(), params] as const,
  details: () => [...applicationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationsKeys.details(), id] as const,
};

export function useApplicationsQuery(
  params: ListApplicationsRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: applicationsKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<Application>>(API_ROUTES.APPLICATIONS.LIST, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useApplicationBoardQuery(
  params: ApplicationBoardRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: applicationsKeys.board(params),
    queryFn: () =>
      fetchApi<ApplicationBoard>(API_ROUTES.APPLICATIONS.BOARD, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useApplicationQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: applicationsKeys.detail(id ?? ''),
    queryFn: () => fetchApi<Application>(API_ROUTES.APPLICATIONS.GET(id!)),
    enabled: !!id,
  });
}

function useInvalidateApplications() {
  const qc = useQueryClient();
  return (application?: Application) => {
    if (application) {
      qc.setQueryData(applicationsKeys.detail(application.id), application);
      qc.invalidateQueries({
        queryKey: candidatesKeys.detail(application.candidateId),
      });
      qc.invalidateQueries({ queryKey: jobsKeys.detail(application.jobId) });
    }
    qc.invalidateQueries({ queryKey: applicationsKeys.lists() });
    qc.invalidateQueries({ queryKey: applicationsKeys.boards() });
    qc.invalidateQueries({ queryKey: candidatesKeys.lists() });
    qc.invalidateQueries({ queryKey: jobsKeys.lists() });
    qc.invalidateQueries({ queryKey: clientsKeys.all });
    qc.invalidateQueries({ queryKey: activitiesKeys.all });
    qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
  };
}

export function useCreateApplicationMutation() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (data: CreateApplicationRequest) =>
      fetchApi<Application>(API_ROUTES.APPLICATIONS.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (application) => invalidate(application),
  });
}

export function useUpdateApplicationStageMutation() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateApplicationStageRequest;
    }) =>
      fetchApi<Application>(API_ROUTES.APPLICATIONS.UPDATE_STAGE(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (application) => invalidate(application),
  });
}

export function useUpdateApplicationMutation() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateApplicationRequest;
    }) =>
      fetchApi<Application>(API_ROUTES.APPLICATIONS.UPDATE(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (application) => invalidate(application),
  });
}

export function useDeleteApplicationMutation() {
  const qc = useQueryClient();
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.APPLICATIONS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: applicationsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: candidatesKeys.details() });
      qc.invalidateQueries({ queryKey: jobsKeys.details() });
      invalidate();
    },
  });
}
