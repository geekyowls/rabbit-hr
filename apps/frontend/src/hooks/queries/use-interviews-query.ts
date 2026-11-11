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
  CreateInterviewRequest,
  Interview,
  InterviewDetail,
  ListInterviewsRequest,
  SubmitScorecardRequest,
  UpdateInterviewRequest,
  UpdateInterviewStatusRequest,
} from '@/types/interview.type';
import { activitiesKeys } from './use-activities-query';
import { applicationsKeys } from './use-applications-query';
import { atsDashboardKeys } from './use-ats-dashboard-query';
import { candidatesKeys } from './use-candidates-query';
import { jobsKeys } from './use-jobs-query';
import { reportsKeys } from './use-reports-query';

export const interviewsKeys = {
  all: ['interviews'] as const,
  lists: () => [...interviewsKeys.all, 'list'] as const,
  list: (params: ListInterviewsRequest) =>
    [...interviewsKeys.lists(), params] as const,
  details: () => [...interviewsKeys.all, 'detail'] as const,
  detail: (id: string) => [...interviewsKeys.details(), id] as const,
  byApplication: (applicationId: string) =>
    [...interviewsKeys.all, 'application', applicationId] as const,
};

export function useInterviewsQuery(
  params: ListInterviewsRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: interviewsKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<Interview>>(API_ROUTES.INTERVIEWS.LIST, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useInterviewQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: interviewsKeys.detail(id ?? ''),
    queryFn: () => fetchApi<InterviewDetail>(API_ROUTES.INTERVIEWS.GET(id!)),
    enabled: !!id,
  });
}

export function useApplicationInterviewsQuery(
  applicationId: string | null | undefined,
) {
  return useQuery({
    queryKey: interviewsKeys.byApplication(applicationId ?? ''),
    queryFn: () =>
      fetchApi<Interview[]>(
        API_ROUTES.INTERVIEWS.BY_APPLICATION(applicationId!),
      ),
    enabled: !!applicationId,
  });
}

function useInvalidateInterviews() {
  const qc = useQueryClient();
  return (interview?: InterviewDetail, stageMayChange = false) => {
    if (interview) {
      qc.setQueryData(interviewsKeys.detail(interview.id), interview);
    }
    qc.invalidateQueries({ queryKey: interviewsKeys.lists() });
    qc.invalidateQueries({
      queryKey: [...interviewsKeys.all, 'application'],
    });
    qc.invalidateQueries({ queryKey: activitiesKeys.all });
    qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
    qc.invalidateQueries({ queryKey: reportsKeys.all });
    if (stageMayChange) {
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: candidatesKeys.all });
      qc.invalidateQueries({ queryKey: jobsKeys.all });
    }
  };
}

export function useCreateInterviewMutation() {
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: (data: CreateInterviewRequest) =>
      fetchApi<InterviewDetail>(API_ROUTES.INTERVIEWS.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (interview) => invalidate(interview, true),
  });
}

export function useUpdateInterviewMutation() {
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInterviewRequest }) =>
      fetchApi<InterviewDetail>(API_ROUTES.INTERVIEWS.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (interview) => invalidate(interview),
  });
}

export function useUpdateInterviewStatusMutation() {
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInterviewStatusRequest;
    }) =>
      fetchApi<InterviewDetail>(API_ROUTES.INTERVIEWS.UPDATE_STATUS(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (interview) => invalidate(interview),
  });
}

export function useDeleteInterviewMutation() {
  const qc = useQueryClient();
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.INTERVIEWS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: (_result, id) => {
      qc.removeQueries({ queryKey: interviewsKeys.detail(id) });
      invalidate();
    },
  });
}

export function useSubmitScorecardMutation() {
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitScorecardRequest }) =>
      fetchApi<InterviewDetail>(API_ROUTES.INTERVIEWS.SUBMIT_SCORECARD(id), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (interview) => invalidate(interview),
  });
}
