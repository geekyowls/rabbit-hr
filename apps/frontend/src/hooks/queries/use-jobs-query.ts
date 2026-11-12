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
  CreateJobRequest,
  JobDetail,
  JobListItem,
  JobStatus,
  ListJobsRequest,
  UpdateJobRequest,
} from '@/types/job.type';
import { atsDashboardKeys } from './use-ats-dashboard-query';
import { clientsKeys } from './use-clients-query';
import { applicationsKeys } from './use-applications-query';

export const jobsKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobsKeys.all, 'list'] as const,
  list: (params: ListJobsRequest) => [...jobsKeys.lists(), params] as const,
  details: () => [...jobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobsKeys.details(), id] as const,
};

export function useJobsQuery(params: ListJobsRequest, enabled: boolean = true) {
  return useQuery({
    queryKey: jobsKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<JobListItem>>(API_ROUTES.JOBS.LIST, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useJobQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: jobsKeys.detail(id ?? ''),
    queryFn: () => fetchApi<JobDetail>(API_ROUTES.JOBS.GET(id!)),
    enabled: !!id,
  });
}

function useInvalidateJobs() {
  const qc = useQueryClient();
  return (job?: JobDetail) => {
    if (job) qc.setQueryData(jobsKeys.detail(job.id), job);
    qc.invalidateQueries({ queryKey: jobsKeys.lists() });
    qc.invalidateQueries({ queryKey: clientsKeys.all });
    qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
  };
}

export function useCreateJobMutation() {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: (data: CreateJobRequest) =>
      fetchApi<JobDetail>(API_ROUTES.JOBS.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (job) => invalidate(job),
  });
}

export function useUpdateJobMutation() {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobRequest }) =>
      fetchApi<JobDetail>(API_ROUTES.JOBS.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (job) => invalidate(job),
  });
}

export function useUpdateJobStatusMutation() {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      fetchApi<JobDetail>(API_ROUTES.JOBS.UPDATE_STATUS(id), {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (job) => invalidate(job),
  });
}

export function useDeleteJobMutation() {
  const qc = useQueryClient();
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.JOBS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: jobsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      invalidate();
    },
  });
}
