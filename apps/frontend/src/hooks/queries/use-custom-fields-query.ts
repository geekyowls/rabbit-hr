import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  CreateCustomFieldRequest,
  CustomFieldDefinition,
  DeleteCustomFieldResponse,
  ListCustomFieldsParams,
  ReorderCustomFieldsRequest,
  UpdateCustomFieldRequest,
} from '@/types/custom-field.type';

export const customFieldsKeys = {
  all: ['custom-fields'] as const,
  lists: () => [...customFieldsKeys.all, 'list'] as const,
  list: (params: ListCustomFieldsParams) =>
    [...customFieldsKeys.lists(), params] as const,
};

function toQuery(params: ListCustomFieldsParams) {
  const query = new URLSearchParams();
  if (params.entity) query.set('entity', params.entity);
  if (params.activeOnly) query.set('activeOnly', 'true');
  return query.toString();
}

export function useCustomFieldsQuery(
  params: ListCustomFieldsParams = {},
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: customFieldsKeys.list(params),
    queryFn: () =>
      fetchApi<CustomFieldDefinition[]>(
        API_ROUTES.CUSTOM_FIELDS.LIST(toQuery(params)),
      ),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

function useInvalidateCustomFields() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: customFieldsKeys.all });
}

export function useCreateCustomFieldMutation() {
  const invalidate = useInvalidateCustomFields();
  return useMutation({
    mutationFn: (data: CreateCustomFieldRequest) =>
      fetchApi<CustomFieldDefinition>(API_ROUTES.CUSTOM_FIELDS.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomFieldMutation() {
  const invalidate = useInvalidateCustomFields();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCustomFieldRequest;
    }) =>
      fetchApi<CustomFieldDefinition>(API_ROUTES.CUSTOM_FIELDS.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomFieldMutation() {
  const invalidate = useInvalidateCustomFields();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<DeleteCustomFieldResponse>(API_ROUTES.CUSTOM_FIELDS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });
}

export function useReorderCustomFieldsMutation() {
  const invalidate = useInvalidateCustomFields();
  return useMutation({
    mutationFn: (data: ReorderCustomFieldsRequest) =>
      fetchApi<CustomFieldDefinition[]>(API_ROUTES.CUSTOM_FIELDS.REORDER, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}
