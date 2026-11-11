'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Inbox as InboxIcon,
  Info,
  Mail,
  MailOpen,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  inboxKeys,
  integrationCapabilitiesKeys,
  mailboxesKeys,
  useInboxStatsQuery,
  useInboxThreadsQuery,
  useMailboxesQuery,
  useUpdateInboxThreadMutation,
} from '@/hooks/queries';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/patterns';
import { errorMessage } from '@/components/applications/application-meta';
import { CandidateDetailDrawer } from '@/components/candidates/candidate-detail-drawer';
import {
  ThreadList,
  folderActions,
  type ThreadAction,
} from '@/components/inbox/thread-list';
import { ThreadView } from '@/components/inbox/thread-view';
import { ComposeWindow } from '@/components/inbox/compose-window';
import {
  ALL_MAILBOXES,
  InboxMobileNav,
  InboxSidebar,
} from '@/components/inbox/inbox-sidebar';
import { InboxSearch, type LinkedValue } from '@/components/inbox/inbox-search';
import type {
  EmailFolder,
  InboxSearchIn,
  InboxThread,
  ListInboxThreadsRequest,
  MovableEmailFolder,
} from '@/types/inbox.type';

const PAGE_SIZE = 25;
const INTEGRATIONS_PATH = '/dashboard/settings/integrations';

const EMPTY_TITLE: Record<EmailFolder, string> = {
  inbox: 'Your inbox is empty',
  sent: 'No sent messages',
  drafts: 'No drafts',
  archive: 'Nothing archived',
  trash: 'Trash is empty',
};

const MOVE_TOAST: Record<MovableEmailFolder, string> = {
  inbox: 'Moved to inbox',
  archive: 'Archived',
  trash: 'Moved to trash',
};

const iconButton =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

function NoMailbox() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-card">
      <EmptyState
        icon={<Mail className="h-8 w-8" />}
        title="Connect a mailbox to use the inbox"
        description="Connect Gmail or Outlook in Settings to read and reply to candidate and client emails here"
        action={
          <Button asChild size="sm">
            <Link href={INTEGRATIONS_PATH}>Go to integrations</Link>
          </Button>
        }
      />
    </div>
  );
}

function InboxContent() {
  useBreadcrumb([{ label: 'Inbox', active: true }]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { hasPermission } = usePermissions();
  const canSend = hasPermission(PERMISSIONS_ENUM.INBOX_SEND);

  const [mailboxId, setMailboxId] = useState<string>(ALL_MAILBOXES);
  const [folder, setFolder] = useState<EmailFolder>('inbox');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState<InboxSearchIn>('all');
  const [linked, setLinked] = useState<LinkedValue>('any');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (!connected && !error) return;
    if (connected) {
      toast.success('Mailbox connected');
      qc.invalidateQueries({ queryKey: mailboxesKeys.all });
      qc.invalidateQueries({ queryKey: integrationCapabilitiesKeys.all });
      qc.invalidateQueries({ queryKey: inboxKeys.all });
    }
    if (error) toast.error('Could not connect mailbox', error);
    router.replace('/dashboard/inbox', { scroll: false });
  }, [searchParams, router, qc]);

  const mailboxesQuery = useMailboxesQuery();
  const mailboxes = useMemo(
    () => mailboxesQuery.data ?? [],
    [mailboxesQuery.data],
  );
  const hasMailbox = mailboxes.length > 0;
  const activeMailboxId = mailboxId === ALL_MAILBOXES ? undefined : mailboxId;

  const stats = useInboxStatsQuery(activeMailboxId, hasMailbox);

  const params = useMemo<ListInboxThreadsRequest>(
    () => ({
      page,
      limit: PAGE_SIZE,
      folder,
      ...(activeMailboxId && { mailboxId: activeMailboxId }),
      ...(unreadOnly && { unreadOnly: true }),
      ...(linked !== 'any' && { linked }),
      ...(debouncedSearch.trim() && {
        search: debouncedSearch.trim(),
        searchIn,
      }),
    }),
    [
      page,
      folder,
      activeMailboxId,
      unreadOnly,
      linked,
      debouncedSearch,
      searchIn,
    ],
  );
  const threadsQuery = useInboxThreadsQuery(params, hasMailbox);
  const draftsQuery = useInboxThreadsQuery(
    {
      page: 1,
      limit: 1,
      folder: 'drafts',
      ...(activeMailboxId && { mailboxId: activeMailboxId }),
    },
    hasMailbox,
  );
  const update = useUpdateInboxThreadMutation();

  useEffect(() => {
    setPage(1);
  }, [folder, activeMailboxId, unreadOnly, linked, debouncedSearch, searchIn]);

  useEffect(() => {
    setOpenId(null);
  }, [folder, activeMailboxId]);

  useEffect(() => {
    setSelected(new Set());
    setCursor(0);
  }, [params]);

  const threads = useMemo(
    () => threadsQuery.data?.data ?? [],
    [threadsQuery.data],
  );
  const total = threadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, threadsQuery.data?.totalPages ?? 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE);
  const filtered = !!debouncedSearch.trim() || unreadOnly || linked !== 'any';

  const showDemo =
    mailboxId === ALL_MAILBOXES
      ? mailboxes.some((m) => m.isDemo) ||
        threads.some((t) => t.mailbox?.isDemo)
      : !!mailboxes.find((m) => m.id === mailboxId)?.isDemo;

  const openIndex = openId ? threads.findIndex((t) => t.id === openId) : -1;
  const actions = folderActions(folder);
  const selectedThreads = threads.filter((t) => selected.has(t.id));
  const allSelected =
    threads.length > 0 && selectedThreads.length === threads.length;

  const openThread = (thread: InboxThread) => {
    setOpenId(thread.id);
    const index = threads.findIndex((t) => t.id === thread.id);
    if (index >= 0) setCursor(index);
    if (thread.isUnread) {
      update.mutate({ id: thread.id, data: { isRead: true } });
    }
  };

  const runAction = async (targets: InboxThread[], action: ThreadAction) => {
    if (targets.length === 0) return;
    const data =
      action.kind === 'move'
        ? { folder: action.folder }
        : { isRead: action.isRead };
    const results = await Promise.allSettled(
      targets.map((t) => update.mutateAsync({ id: t.id, data })),
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      toast.error(
        'Could not update conversation',
        errorMessage((failed[0] as PromiseRejectedResult).reason),
      );
    }
    if (failed.length < results.length) {
      toast.success(
        action.kind === 'move'
          ? MOVE_TOAST[action.folder]
          : action.isRead
            ? 'Marked as read'
            : 'Marked as unread',
      );
    }
    setSelected(new Set());
    if (action.kind === 'move' && targets.some((t) => t.id === openId)) {
      setOpenId(null);
    }
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const changeFolder = (next: EmailFolder) => {
    setFolder(next);
    setOpenId(null);
  };

  const refresh = () => {
    threadsQuery.refetch();
    stats.refetch();
  };

  const cursorThread = threads[cursor];
  const step = (delta: number) => {
    if (openId) {
      const target = threads[openIndex + delta];
      if (target) openThread(target);
      return;
    }
    setCursor((c) => Math.min(Math.max(0, c + delta), threads.length - 1));
  };
  const archiveCurrent = () => {
    if (!actions.canArchive) return;
    const target = openId ? threads[openIndex] : cursorThread;
    if (target) runAction([target], { kind: 'move', folder: 'archive' });
  };
  const back = () => setOpenId(null);

  useKeyboardShortcuts(
    [
      { key: 'j', handler: () => step(1) },
      { key: 'k', handler: () => step(-1) },
      {
        key: 'Enter',
        handler: () => {
          if (!openId && cursorThread) openThread(cursorThread);
        },
      },
      { key: 'e', handler: archiveCurrent },
      { key: 'u', handler: back },
      { key: 'Escape', handler: back },
      {
        key: 'c',
        handler: () => {
          if (canSend) setComposeOpen(true);
        },
      },
    ],
    {
      enabled: hasMailbox && candidateId === null,
      skipWhenDialogOpen: true,
    },
  );

  if (mailboxesQuery.isLoading) {
    return <ListPageSkeleton filters={4} />;
  }

  const navProps = {
    folder,
    onFolderChange: changeFolder,
    showDrafts: (draftsQuery.data?.total ?? 0) > 0,
    unread: stats.data?.unread ?? 0,
    mailboxes,
    mailboxId,
    onMailboxChange: setMailboxId,
    canSend,
    onCompose: () => setComposeOpen(true),
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4 md:flex-row md:gap-4">
      {!hasMailbox ? (
        <NoMailbox />
      ) : (
        <>
          <InboxSidebar {...navProps} stats={stats.data} />
          <InboxMobileNav {...navProps} />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <InboxSearch
                search={search}
                onSearchChange={setSearch}
                searchIn={searchIn}
                onSearchInChange={setSearchIn}
                linked={linked}
                onLinkedChange={setLinked}
                unreadOnly={unreadOnly}
                onUnreadOnlyChange={setUnreadOnly}
              />
              <div className="ml-auto flex shrink-0 items-center">
                <button
                  type="button"
                  aria-label="Refresh"
                  title="Refresh"
                  className={iconButton}
                  onClick={refresh}
                >
                  <RotateCw
                    className={cn(
                      'h-4 w-4',
                      threadsQuery.isFetching && 'animate-spin',
                    )}
                  />
                </button>
                {!openId && (
                  <>
                    <span className="hidden whitespace-nowrap px-2 text-xs tabular-nums text-muted-foreground sm:inline">
                      {total === 0
                        ? '0 of 0'
                        : `${rangeStart} to ${rangeEnd} of ${total}`}
                    </span>
                    <button
                      type="button"
                      aria-label="Newer"
                      title="Newer"
                      className={iconButton}
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Older"
                      title="Older"
                      className={iconButton}
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
              {showDemo && (
                <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Demo inbox, messages are not sent
                </div>
              )}

              {openId ? (
                <ThreadView
                  key={openId}
                  threadId={openId}
                  canSend={canSend}
                  mailboxes={mailboxes}
                  position={
                    openIndex >= 0
                      ? (page - 1) * PAGE_SIZE + openIndex + 1
                      : null
                  }
                  total={total}
                  onPrev={
                    openIndex > 0
                      ? () => openThread(threads[openIndex - 1])
                      : undefined
                  }
                  onNext={
                    openIndex >= 0 && openIndex < threads.length - 1
                      ? () => openThread(threads[openIndex + 1])
                      : undefined
                  }
                  onBack={back}
                  onOpenCandidate={setCandidateId}
                />
              ) : (
                <>
                  <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-3">
                    <Checkbox
                      aria-label="Select all"
                      disabled={threads.length === 0}
                      checked={
                        allSelected
                          ? true
                          : selectedThreads.length > 0
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={() =>
                        setSelected(
                          allSelected
                            ? new Set()
                            : new Set(threads.map((t) => t.id)),
                        )
                      }
                    />
                    {selectedThreads.length > 0 && (
                      <div className="ml-3 flex items-center gap-0.5">
                        {actions.canArchive && (
                          <button
                            type="button"
                            aria-label="Archive"
                            title="Archive"
                            className={iconButton}
                            disabled={update.isPending}
                            onClick={() =>
                              runAction(selectedThreads, {
                                kind: 'move',
                                folder: 'archive',
                              })
                            }
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        {actions.canRestore && (
                          <button
                            type="button"
                            aria-label="Move to inbox"
                            title="Move to inbox"
                            className={iconButton}
                            disabled={update.isPending}
                            onClick={() =>
                              runAction(selectedThreads, {
                                kind: 'move',
                                folder: 'inbox',
                              })
                            }
                          >
                            <InboxIcon className="h-4 w-4" />
                          </button>
                        )}
                        {actions.canTrash && (
                          <button
                            type="button"
                            aria-label="Delete"
                            title="Delete"
                            className={iconButton}
                            disabled={update.isPending}
                            onClick={() =>
                              runAction(selectedThreads, {
                                kind: 'move',
                                folder: 'trash',
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <span className="mx-1 h-5 w-px bg-border" />
                        <button
                          type="button"
                          aria-label="Mark as read"
                          title="Mark as read"
                          className={iconButton}
                          disabled={update.isPending}
                          onClick={() =>
                            runAction(selectedThreads, {
                              kind: 'read',
                              isRead: true,
                            })
                          }
                        >
                          <MailOpen className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Mark as unread"
                          title="Mark as unread"
                          className={iconButton}
                          disabled={update.isPending}
                          onClick={() =>
                            runAction(selectedThreads, {
                              kind: 'read',
                              isRead: false,
                            })
                          }
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {selectedThreads.length} selected
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <ThreadList
                      threads={threads}
                      loading={threadsQuery.isLoading}
                      folder={folder}
                      selected={selected}
                      cursor={cursor}
                      onToggle={toggleSelected}
                      onOpen={openThread}
                      onAction={(thread, action) => runAction([thread], action)}
                      emptyTitle={
                        filtered
                          ? 'No conversations match your filters'
                          : EMPTY_TITLE[folder]
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {composeOpen && (
        <ComposeWindow
          onClose={() => setComposeOpen(false)}
          mailboxes={mailboxes}
          defaultMailboxId={activeMailboxId ?? null}
        />
      )}

      <CandidateDetailDrawer
        candidateId={candidateId}
        open={candidateId !== null}
        onOpenChange={(o) => !o && setCandidateId(null)}
      />
    </div>
  );
}

export default function InboxPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.INBOX_READ}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to view the inbox
        </div>
      }
    >
      <Suspense fallback={<ListPageSkeleton filters={4} />}>
        <InboxContent />
      </Suspense>
    </PermissionGuard>
  );
}
