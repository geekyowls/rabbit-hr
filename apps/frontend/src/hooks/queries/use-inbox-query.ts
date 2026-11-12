import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  InboxStats,
  InboxThread,
  InboxThreadDetail,
  InboxThreadListResponse,
  ListInboxThreadsRequest,
  SendInboxMessageRequest,
  SendInboxMessageResponse,
  UpdateInboxThreadRequest,
} from '@/types/inbox.type';
import { activitiesKeys } from './use-activities-query';

export const INBOX_UNREAD_POLL_MS = 60_000;

export const inboxKeys = {
  all: ['inbox'] as const,
  lists: () => [...inboxKeys.all, 'list'] as const,
  list: (params: ListInboxThreadsRequest) =>
    [...inboxKeys.lists(), params] as const,
  details: () => [...inboxKeys.all, 'detail'] as const,
  detail: (id: string) => [...inboxKeys.details(), id] as const,
  stats: (mailboxId?: string) =>
    [...inboxKeys.all, 'stats', mailboxId ?? 'all'] as const,
};

export function useInboxThreadsQuery(
  params: ListInboxThreadsRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: inboxKeys.list(params),
    queryFn: () =>
      fetchApi<InboxThreadListResponse>(API_ROUTES.INBOX.THREADS, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    refetchInterval: INBOX_UNREAD_POLL_MS,
    enabled,
  });
}

export function useInboxThreadQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: inboxKeys.detail(id ?? ''),
    queryFn: () => fetchApi<InboxThreadDetail>(API_ROUTES.INBOX.THREAD(id!)),
    enabled: !!id,
  });
}

export function useInboxStatsQuery(mailboxId?: string, enabled = true) {
  return useQuery({
    queryKey: inboxKeys.stats(mailboxId),
    queryFn: () =>
      fetchApi<InboxStats>(
        API_ROUTES.INBOX.STATS(
          mailboxId ? new URLSearchParams({ mailboxId }).toString() : undefined,
        ),
      ),
    refetchInterval: INBOX_UNREAD_POLL_MS,
    enabled,
  });
}

function useInvalidateInbox() {
  const qc = useQueryClient();
  return (threadId?: string, linksChanged = false) => {
    qc.invalidateQueries({ queryKey: inboxKeys.lists() });
    qc.invalidateQueries({ queryKey: [...inboxKeys.all, 'stats'] });
    if (threadId) {
      qc.invalidateQueries({ queryKey: inboxKeys.detail(threadId) });
    }
    if (linksChanged) {
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    }
  };
}

export function useUpdateInboxThreadMutation() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInboxThreadRequest;
    }) =>
      fetchApi<InboxThread>(API_ROUTES.INBOX.UPDATE_THREAD(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (thread, { data }) =>
      invalidate(
        thread.id,
        data.candidateId !== undefined ||
          data.clientId !== undefined ||
          data.applicationId !== undefined,
      ),
  });
}

export function useSendInboxMessageMutation() {
  const invalidate = useInvalidateInbox();
  return useMutation({
    mutationFn: (data: SendInboxMessageRequest) =>
      fetchApi<SendInboxMessageResponse>(API_ROUTES.INBOX.SEND, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => invalidate(result.thread.id, true),
  });
}
