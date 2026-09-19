import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type { NotificationFeedResponse } from '@/types/notification';

export const notificationsKeys = {
  all: ['notifications'] as const,
  feed: ['notifications', 'feed'] as const,
};

export function useNotificationsFeedQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: notificationsKeys.feed,
    queryFn: () =>
      fetchApi<NotificationFeedResponse>(API_ROUTES.NOTIFICATION_FEED.FEED),
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(API_ROUTES.NOTIFICATION_FEED.MARK_READ(id), { method: 'POST' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationsKeys.feed });
      const prev = qc.getQueryData<NotificationFeedResponse>(
        notificationsKeys.feed,
      );
      if (prev) {
        const wasUnread = prev.items.find((n) => n.id === id && !n.isRead);
        qc.setQueryData<NotificationFeedResponse>(notificationsKeys.feed, {
          items: prev.items.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
          unreadCount: wasUnread
            ? Math.max(0, prev.unreadCount - 1)
            : prev.unreadCount,
        });
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationsKeys.feed, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationsKeys.feed });
    },
  });
}

export function useSendTestNotificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi(API_ROUTES.NOTIFICATION_FEED.TEST, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationsKeys.feed });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi(API_ROUTES.NOTIFICATION_FEED.READ_ALL, { method: 'POST' }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationsKeys.feed });
      const prev = qc.getQueryData<NotificationFeedResponse>(
        notificationsKeys.feed,
      );
      if (prev) {
        qc.setQueryData<NotificationFeedResponse>(notificationsKeys.feed, {
          items: prev.items.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationsKeys.feed, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationsKeys.feed });
    },
  });
}
