import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  PipelineStage,
  ReplacePipelineStagesRequest,
} from '@/types/pipeline-stage.type';
import { applicationsKeys } from './use-applications-query';
import { atsDashboardKeys } from './use-ats-dashboard-query';
import { candidatesKeys } from './use-candidates-query';
import { jobsKeys } from './use-jobs-query';

export const pipelineStagesKeys = {
  all: ['pipeline-stages'] as const,
  list: () => [...pipelineStagesKeys.all, 'list'] as const,
};

export function usePipelineStagesQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: pipelineStagesKeys.list(),
    queryFn: () => fetchApi<PipelineStage[]>(API_ROUTES.PIPELINE_STAGES.LIST),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useReplacePipelineStagesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReplacePipelineStagesRequest) =>
      fetchApi<PipelineStage[]>(API_ROUTES.PIPELINE_STAGES.REPLACE, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (stages) => {
      qc.setQueryData(pipelineStagesKeys.list(), stages);
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: candidatesKeys.all });
      qc.invalidateQueries({ queryKey: jobsKeys.all });
      qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
    },
  });
}
