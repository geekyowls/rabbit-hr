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
  ClientContact,
  ClientDetail,
  ClientListItem,
  CreateClientContactRequest,
  CreateClientRequest,
  ListClientsRequest,
  UpdateClientContactRequest,
  UpdateClientRequest,
} from '@/types/client.type';
import { jobsKeys } from './use-jobs-query';
import { atsDashboardKeys } from './use-ats-dashboard-query';

export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (params: ListClientsRequest) =>
    [...clientsKeys.lists(), params] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientsKeys.details(), id] as const,
};

export function useClientsQuery(
  params: ListClientsRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<ClientListItem>>(API_ROUTES.CLIENTS.LIST, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useClientQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: clientsKeys.detail(id ?? ''),
    queryFn: () => fetchApi<ClientDetail>(API_ROUTES.CLIENTS.GET(id!)),
    enabled: !!id,
  });
}

export function useCreateClientMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientRequest) =>
      fetchApi<ClientDetail>(API_ROUTES.CLIENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useUpdateClientMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) =>
      fetchApi<ClientDetail>(API_ROUTES.CLIENTS.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (client) => {
      qc.setQueryData(clientsKeys.detail(client.id), client);
      qc.invalidateQueries({ queryKey: clientsKeys.lists() });
      qc.invalidateQueries({ queryKey: jobsKeys.all });
    },
  });
}

export function useDeleteClientMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.CLIENTS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: clientsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: clientsKeys.lists() });
      qc.invalidateQueries({ queryKey: jobsKeys.all });
      qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
    },
  });
}

export function useCreateClientContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string;
      data: CreateClientContactRequest;
    }) =>
      fetchApi<ClientContact>(API_ROUTES.CLIENTS.CREATE_CONTACT(clientId), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_res, { clientId }) => {
      qc.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
      qc.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });
}

export function useUpdateClientContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      contactId,
      data,
    }: {
      clientId: string;
      contactId: string;
      data: UpdateClientContactRequest;
    }) =>
      fetchApi<ClientContact>(
        API_ROUTES.CLIENTS.UPDATE_CONTACT(clientId, contactId),
        { method: 'PUT', body: JSON.stringify(data) },
      ),
    onSuccess: (_res, { clientId }) => {
      qc.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
    },
  });
}

export function useDeleteClientContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      contactId,
    }: {
      clientId: string;
      contactId: string;
    }) =>
      fetchApi<{ success: boolean }>(
        API_ROUTES.CLIENTS.DELETE_CONTACT(clientId, contactId),
        { method: 'DELETE' },
      ),
    onSuccess: (_res, { clientId }) => {
      qc.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
      qc.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });
}
