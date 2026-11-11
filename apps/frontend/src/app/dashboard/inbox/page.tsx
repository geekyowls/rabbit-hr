'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Info,
  Mail,
  PenSquare,
  Rows2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
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
import {
  EmptyState,
  FilterBar,
  FilterDropdown,
  SearchInput,
  SegmentedControl,
  StatTile,
  StatTileRow,
  ToggleControl,
  ToolbarButton,
} from '@/components/patterns';
import { CandidateDetailDrawer } from '@/components/candidates/candidate-detail-drawer';
import { ThreadList } from '@/components/inbox/thread-list';
import { ThreadView } from '@/components/inbox/thread-view';
import {
  ComposeDialog,
  type ComposeMode,
} from '@/components/inbox/compose-dialog';
import {
  FOLDERS,
  LINKED_OPTIONS,
  SEARCH_IN_OPTIONS,
  formatWaitHours,
  readInboxLayout,
  saveInboxLayout,
  type InboxLayout,
} from '@/components/inbox/inbox-utils';
import type {
  EmailFolder,
  InboxLinkedFilter,
  InboxSearchIn,
  InboxThread,
  ListInboxThreadsRequest,
} from '@/types/inbox.type';

const PAGE_SIZE = 25;
const ALL = 'all';
const INTEGRATIONS_PATH = '/dashboard/settings/integrations';

const EMPTY_TITLE: Record<EmailFolder, string> = {
  inbox: 'Your inbox is empty',
  sent: 'No sent messages',
  drafts: 'No drafts',
  archive: 'Nothing archived',
  trash: 'Trash is empty',
};

function NoMailbox() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-md border border-border bg-card">
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

  const [mailboxId, setMailboxId] = useState<string>(ALL);
  const [folder, setFolder] = useState<EmailFolder>('inbox');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState<InboxSearchIn>('all');
  const [linked, setLinked] = useState<InboxLinkedFilter | 'any'>('any');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layout, setLayout] = useState<InboxLayout>('side');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>({ kind: 'new' });
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => setLayout(readInboxLayout()), []);

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
  const activeMailboxId = mailboxId === ALL ? undefined : mailboxId;

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
  const update = useUpdateInboxThreadMutation();

  useEffect(() => {
    setPage(1);
  }, [folder, activeMailboxId, unreadOnly, linked, debouncedSearch, searchIn]);

  useEffect(() => {
    setSelectedId(null);
  }, [folder, activeMailboxId]);

  const threads = threadsQuery.data?.data ?? [];
  const total = threadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, threadsQuery.data?.totalPages ?? 1);

  const showDemo =
    mailboxId === ALL
      ? mailboxes.some((m) => m.isDemo) ||
        threads.some((t) => t.mailbox?.isDemo)
      : !!mailboxes.find((m) => m.id === mailboxId)?.isDemo;

  const mailboxOptions = useMemo(
    () => [
      { value: ALL, label: 'All mailboxes' },
      ...mailboxes.map((m) => ({ value: m.id, label: m.emailAddress })),
    ],
    [mailboxes],
  );

  const changeLayout = (next: InboxLayout) => {
    setLayout(next);
    saveInboxLayout(next);
  };

  const openThread = (thread: InboxThread) => {
    setSelectedId(thread.id);
    if (thread.isUnread) {
      update.mutate({ id: thread.id, data: { isRead: true } });
    }
  };

  const openCompose = (mode: ComposeMode) => {
    setComposeMode(mode);
    setComposeOpen(true);
  };

  if (mailboxesQuery.isLoading) {
    return <ListPageSkeleton filters={4} />;
  }

  const s = stats.data;
  const folderNav = (
    <nav className="flex shrink-0 gap-1 md:w-40 md:flex-col">
      {FOLDERS.map((f) => {
        const active = f.value === folder;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => setFolder(f.value)}
            className={cn(
              'flex h-8 items-center justify-between gap-2 rounded-md px-2.5 text-sm transition-colors',
              active
                ? 'bg-[#EDF1EE] font-medium text-[#3F6650] dark:bg-[#3F6650]/25 dark:text-[#8FBFA1]'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {f.label}
            {f.value === 'inbox' && !!s?.unread && (
              <span className="rounded px-1.5 text-[11px] font-semibold tabular-nums">
                {s.unread}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const list = (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card',
        layout === 'side' ? 'md:w-[380px] md:shrink-0' : 'max-h-[42%]',
        layout === 'side' && selectedId && 'hidden md:flex',
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ThreadList
          threads={threads}
          loading={threadsQuery.isLoading}
          selectedId={selectedId}
          onSelect={openThread}
          emptyTitle={
            debouncedSearch.trim() || unreadOnly || linked !== 'any'
              ? 'No conversations match your filters'
              : EMPTY_TITLE[folder]
          }
        />
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        <span>
          {threadsQuery.isFetching && !threadsQuery.isLoading
            ? 'Updating...'
            : `${total} conversations`}
        </span>
        <span className="flex items-center gap-2">
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background hover:bg-accent disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background hover:bg-accent disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    </div>
  );

  const pane = (
    <div
      className={cn(
        'min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-card',
        layout === 'side' && !selectedId && 'hidden md:block',
      )}
    >
      <ThreadView
        threadId={selectedId}
        canSend={canSend}
        onReply={(thread, message, all) =>
          openCompose({ kind: 'reply', thread, message, all })
        }
        onOpenCandidate={setCandidateId}
        onClose={selectedId ? () => setSelectedId(null) : undefined}
      />
    </div>
  );

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      {!hasMailbox ? (
        <NoMailbox />
      ) : (
        <>
          {showDemo && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0" />
              Demo inbox, messages are not sent
            </div>
          )}

          <StatTileRow className="grid-cols-2">
            <StatTile className="p-3" label="Unread" value={s?.unread ?? '-'} />
            <StatTile
              className="p-3"
              label="In inbox"
              value={s?.inboxCount ?? '-'}
            />
            <StatTile
              className="p-3"
              label="Replies from here, last 7 days"
              value={s?.repliesLast7Days ?? '-'}
            />
            <StatTile
              className="p-3"
              label="Typical wait before reply"
              value={formatWaitHours(s?.medianFirstReplyHours ?? null)}
              unit={
                s && s.firstReplySampleSize > 0
                  ? `median of ${s.firstReplySampleSize}`
                  : undefined
              }
            />
          </StatTileRow>

          <FilterBar
            end={
              <>
                <SegmentedControl
                  value={layout}
                  onChange={changeLayout}
                  className="hidden md:inline-flex"
                  options={[
                    {
                      value: 'side',
                      icon: <Columns2 className="h-4 w-4" />,
                      label: 'Side by side',
                    },
                    {
                      value: 'stacked',
                      icon: <Rows2 className="h-4 w-4" />,
                      label: 'Stacked',
                    },
                  ]}
                />
                {canSend && (
                  <ToolbarButton
                    variant="primary"
                    icon={PenSquare}
                    onClick={() => openCompose({ kind: 'new' })}
                  >
                    New message
                  </ToolbarButton>
                )}
              </>
            }
          >
            {mailboxes.length > 1 && (
              <FilterDropdown
                label="Mailbox"
                value={mailboxId}
                options={mailboxOptions}
                onChange={setMailboxId}
              />
            )}
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search mail..."
            />
            <FilterDropdown
              label="Search in"
              value={searchIn}
              options={SEARCH_IN_OPTIONS}
              onChange={(v) => setSearchIn(v as InboxSearchIn)}
            />
            <FilterDropdown
              label="Linked"
              value={linked}
              options={LINKED_OPTIONS}
              onChange={(v) => setLinked(v as InboxLinkedFilter | 'any')}
            />
            <ToggleControl
              id="inbox-unread-only"
              label="Unread only"
              checked={unreadOnly}
              onCheckedChange={setUnreadOnly}
            />
          </FilterBar>

          <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
            {folderNav}
            <div
              className={cn(
                'flex min-h-0 min-w-0 flex-1 gap-3',
                layout === 'side' ? 'flex-col md:flex-row' : 'flex-col',
              )}
            >
              {list}
              {pane}
            </div>
          </div>
        </>
      )}

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={composeMode}
        mailboxes={mailboxes}
        defaultMailboxId={activeMailboxId ?? null}
      />

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
