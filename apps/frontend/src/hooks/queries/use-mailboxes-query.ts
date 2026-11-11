import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  ConnectMailboxRequest,
  ConnectMailboxResponse,
  Mailbox,
  MailboxSyncResponse,
} from '@/types/mailbox.type';
import { inboxKeys } from './use-inbox-query';

export const mailboxesKeys = {
  all: ['mailboxes'] as const,
  list: () => [...mailboxesKeys.all, 'list'] as const,
};

export function useMailboxesQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: mailboxesKeys.list(),
    queryFn: () => fetchApi<Mailbox[]>(API_ROUTES.MAILBOXES.LIST),
    enabled,
  });
}

export function useConnectMailboxMutation() {
  return useMutation({
    mutationFn: ({ provider, shared }: ConnectMailboxRequest) =>
      fetchApi<ConnectMailboxResponse>(API_ROUTES.MAILBOXES.CONNECT(provider), {
        method: 'POST',
        body: JSON.stringify({ shared: shared ?? false }),
      }),
  });
}

export function useDisconnectMailboxMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.MAILBOXES.DISCONNECT(id), {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mailboxesKeys.all });
      qc.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}

export function useSyncMailboxMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<MailboxSyncResponse>(API_ROUTES.MAILBOXES.SYNC(id), {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mailboxesKeys.all });
    },
  });
}
