'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  useNotificationsFeedQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSendTestNotificationMutation,
} from '@/hooks/queries/use-notifications-query';
import type {
  NotificationFeedItem,
  NotificationPriority,
} from '@/types/notification';
import { WebPushToggle } from './web-push-toggle';

const PRIORITY_ICON: Record<
  NotificationPriority,
  {
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    color: string;
  }
> = {
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    color: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    color: 'text-amber-600 dark:text-amber-400',
  },
  critical: {
    icon: ShieldAlert,
    bg: 'bg-red-50 dark:bg-red-950/40',
    color: 'text-red-600 dark:text-red-400',
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data } = useNotificationsFeedQuery();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const sendTest = useSendTestNotificationMutation();
  const isDev = process.env.NODE_ENV !== 'production';

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleItemClick = (item: NotificationFeedItem) => {
    if (!item.isRead) markRead.mutate(item.id);
    if (item.link) {
      setOpen(false);
      router.push(item.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-dark-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Notifications
          </div>
          <div className="flex items-center gap-3">
            {isDev && (
              <button
                type="button"
                onClick={() => sendTest.mutate()}
                disabled={sendTest.isPending}
                className="text-xs font-medium text-zinc-500 hover:underline disabled:opacity-60 dark:text-zinc-400"
              >
                Send test
              </button>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No notifications
            </div>
          ) : (
            items.map((item) => (
              <BellItem
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))
          )}
        </div>
        <WebPushToggle />
      </PopoverContent>
    </Popover>
  );
}

function BellItem({
  item,
  onClick,
}: {
  item: NotificationFeedItem;
  onClick: () => void;
}) {
  const tone = PRIORITY_ICON[item.priority];
  const Icon = tone.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          tone.bg,
        )}
      >
        <Icon className={cn('h-4 w-4', tone.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.title}
          </div>
          {!item.isRead && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          )}
        </div>
        <div className="mt-0.5 line-clamp-2 break-words whitespace-pre-line text-xs text-zinc-600 dark:text-zinc-400">
          {item.body}
        </div>
        <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {timeAgo(item.createdAt)}
        </div>
      </div>
    </button>
  );
}
