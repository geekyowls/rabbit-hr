import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type { ReportSummary, ReportSummaryRequest } from '@/types/report.type';

export const reportsKeys = {
  all: ['reports'] as const,
  summaries: () => [...reportsKeys.all, 'summary'] as const,
  summary: (params: ReportSummaryRequest) =>
    [...reportsKeys.summaries(), params] as const,
};

function toQueryString(params: ReportSummaryRequest): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export function useReportSummaryQuery(
  params: ReportSummaryRequest = {},
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: reportsKeys.summary(params),
    queryFn: () =>
      fetchApi<ReportSummary>(
        API_ROUTES.REPORTS.SUMMARY(toQueryString(params) || undefined),
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
}
