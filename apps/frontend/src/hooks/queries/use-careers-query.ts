import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { API_ROUTES, buildApiUrl } from '@/config/api-routes';
import { ApiError } from '@/utils/error-class';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  ApplyToJobRequest,
  ApplyToJobResponse,
  CareersJobDetail,
  CareersJobListItem,
  CareersOrganization,
  CareersUploadUrlRequest,
  CareersUploadUrlResponse,
  ListCareersJobsParams,
} from '@/types/careers.type';

async function publicRequest<T>(
  route: string,
  init?: RequestInit,
  unwrap: boolean = true,
): Promise<T> {
  const response = await fetch(buildApiUrl(route), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message;
    throw new ApiError(message || 'Request failed', response.status);
  }
  return (unwrap ? body.data : body) as T;
}

function toQueryString(params: ListCareersJobsParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  return search.toString();
}

export const careersKeys = {
  all: ['careers'] as const,
  organization: (orgSlug: string) =>
    [...careersKeys.all, orgSlug, 'organization'] as const,
  jobs: (orgSlug: string, params: ListCareersJobsParams) =>
    [...careersKeys.all, orgSlug, 'jobs', params] as const,
  job: (orgSlug: string, jobId: string) =>
    [...careersKeys.all, orgSlug, 'job', jobId] as const,
};

export function useCareersOrganizationQuery(
  orgSlug: string | null | undefined,
) {
  return useQuery({
    queryKey: careersKeys.organization(orgSlug ?? ''),
    queryFn: () =>
      publicRequest<CareersOrganization>(
        API_ROUTES.PUBLIC_CAREERS.ORGANIZATION(orgSlug!),
      ),
    enabled: !!orgSlug,
  });
}

export function useCareersJobsQuery(
  orgSlug: string | null | undefined,
  params: ListCareersJobsParams = {},
) {
  return useQuery({
    queryKey: careersKeys.jobs(orgSlug ?? '', params),
    queryFn: () =>
      publicRequest<PaginatedResponse<CareersJobListItem>>(
        API_ROUTES.PUBLIC_CAREERS.JOBS(orgSlug!, toQueryString(params)),
        undefined,
        false,
      ),
    placeholderData: keepPreviousData,
    enabled: !!orgSlug,
  });
}

export function useCareersJobQuery(
  orgSlug: string | null | undefined,
  jobId: string | null | undefined,
) {
  return useQuery({
    queryKey: careersKeys.job(orgSlug ?? '', jobId ?? ''),
    queryFn: () =>
      publicRequest<CareersJobDetail>(
        API_ROUTES.PUBLIC_CAREERS.JOB(orgSlug!, jobId!),
      ),
    enabled: !!orgSlug && !!jobId,
  });
}

export function useApplyToJobMutation() {
  return useMutation({
    mutationFn: ({
      orgSlug,
      jobId,
      data,
    }: {
      orgSlug: string;
      jobId: string;
      data: ApplyToJobRequest;
    }) =>
      publicRequest<ApplyToJobResponse>(
        API_ROUTES.PUBLIC_CAREERS.APPLY(orgSlug, jobId),
        { method: 'POST', body: JSON.stringify(data) },
      ),
  });
}

export function useCareersUploadUrlMutation() {
  return useMutation({
    mutationFn: ({
      orgSlug,
      data,
    }: {
      orgSlug: string;
      data: CareersUploadUrlRequest;
    }) =>
      publicRequest<CareersUploadUrlResponse>(
        API_ROUTES.PUBLIC_CAREERS.UPLOAD_URL(orgSlug),
        { method: 'POST', body: JSON.stringify(data) },
      ),
  });
}
