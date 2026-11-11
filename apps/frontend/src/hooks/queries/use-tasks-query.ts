import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type { PaginatedResponse, UserSummary } from '@/types/common.type';
import type {
  CreateTaskRequest,
  ListTasksRequest,
  Task,
  UpdateTaskRequest,
} from '@/types/task.type';
import { activitiesKeys } from './use-activities-query';
import { atsDashboardKeys } from './use-ats-dashboard-query';

export const tasksKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksKeys.all, 'list'] as const,
  list: (params: ListTasksRequest) => [...tasksKeys.lists(), params] as const,
};

export function useTasksQuery(
  params: ListTasksRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: tasksKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<Task>>(API_ROUTES.TASKS.LIST, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export const userNamesKeys = {
  all: ['users', 'names'] as const,
};

export function useUserNamesQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: userNamesKeys.all,
    queryFn: () => fetchApi<UserSummary[]>(API_ROUTES.USERS.NAMES()),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

function useInvalidateTasks() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: tasksKeys.all });
    qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
  };
}

export function useCreateTaskMutation() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      fetchApi<Task>(API_ROUTES.TASKS.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateTaskMutation() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      fetchApi<Task>(API_ROUTES.TASKS.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidate(),
  });
}

export function useCompleteTaskMutation() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<Task>(API_ROUTES.TASKS.COMPLETE(id), { method: 'PATCH' }),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    },
  });
}

export function useDeleteTaskMutation() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.TASKS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: () => invalidate(),
  });
}
