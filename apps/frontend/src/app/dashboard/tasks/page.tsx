'use client';

import { useFormatters } from '@/hooks/use-formatters';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useDebounce } from '@/hooks/use-debounce';
import { useSession } from '@/contexts/session-context';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import {
  useCompleteTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useUpdateTaskMutation,
} from '@/hooks/queries';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ConfirmDialog } from '@/components/jobs/confirm-dialog';
import { ListFooter } from '@/components/jobs/list-footer';
import {
  DataGrid,
  EmptyState,
  FilterBar,
  FilterDropdown,
  RowActions,
  SearchInput,
  SegmentedControl,
  StatusPill,
  ToolbarButton,
  TruncatedText,
  type DataGridColumn,
  type RowAction,
} from '@/components/patterns';

import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import {
  TASK_DUE_CLASS,
  getTaskDueState,
  taskLinkHref,
  taskLinkLabel,
  userDisplayName,
} from '@/components/tasks/task-utils';
import type {
  ListTasksRequest,
  Task,
  TaskDueFilter,
  TaskStatus,
} from '@/types/task.type';

type Owner = 'mine' | 'everyone';
type StatusFilter = TaskStatus | 'all';
type DueFilter = TaskDueFilter | 'any';

const LIMIT = 25;

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
];

const DUE_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
];

function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function TasksContent() {
  useBreadcrumb([{ label: 'Tasks', active: true }]);
  const fmt = useFormatters();
  const { user } = useSession();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS_ENUM.TASK_CREATE);
  const canUpdate = hasPermission(PERMISSIONS_ENUM.TASK_UPDATE);
  const canDelete = hasPermission(PERMISSIONS_ENUM.TASK_DELETE);

  const [owner, setOwner] = useState<Owner>('mine');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [due, setDue] = useState<DueFilter>('any');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, owner, status, due]);

  const params: ListTasksRequest = {
    page,
    limit: LIMIT,
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(owner === 'mine' && { mine: true }),
    ...(status !== 'all' && { status }),
    ...(due !== 'any' && { due }),
  };

  const { data, isLoading, isFetching, error } = useTasksQuery(params);
  const completeTask = useCompleteTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };

  const handleComplete = async (task: Task) => {
    try {
      await completeTask.mutateAsync(task.id);
      toast.success('Task completed');
    } catch (err) {
      toast.error(errorText(err, 'Could not complete task'));
    }
  };

  const handleReopen = async (task: Task) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: 'open' } });
      toast.success('Task reopened');
    } catch (err) {
      toast.error(errorText(err, 'Could not reopen task'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask.mutateAsync(deleteTarget.id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(errorText(err, 'Could not delete task'));
      throw err;
    }
  };

  const rowActions = (task: Task): RowAction[] => [
    ...(canUpdate && task.status === 'open'
      ? [
          {
            label: 'Mark done',
            icon: <CheckCircle2 className="h-4 w-4" />,
            onSelect: () => handleComplete(task),
          },
        ]
      : []),
    ...(canUpdate && task.status === 'done'
      ? [
          {
            label: 'Reopen',
            icon: <RotateCcw className="h-4 w-4" />,
            onSelect: () => handleReopen(task),
          },
        ]
      : []),
    ...(canUpdate
      ? [
          {
            label: 'Edit',
            icon: <Pencil className="h-4 w-4" />,
            onSelect: () => openEdit(task),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            onSelect: () => setDeleteTarget(task),
            destructive: true,
          },
        ]
      : []),
  ];

  const columns: DataGridColumn<Task>[] = [
    {
      key: 'title',
      header: 'Task',
      width: 320,
      render: (r) => (
        <div className="min-w-0">
          <TruncatedText
            text={r.title}
            className={cn(
              'font-medium',
              r.status === 'done' && 'text-muted-foreground line-through',
            )}
          />
          <TruncatedText
            text={r.description}
            className="text-xs text-muted-foreground"
          />
        </div>
      ),
    },
    {
      key: 'linked',
      header: 'Linked to',
      width: 240,
      render: (r) => {
        const label = taskLinkLabel(r);
        const href = taskLinkHref(r);
        if (!label) return <span className="text-muted-foreground">None</span>;
        return href ? (
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="block truncate hover:underline"
            title={label}
          >
            {label}
          </Link>
        ) : (
          <TruncatedText text={label} />
        );
      },
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: 180,
      render: (r) => {
        const name = userDisplayName(r.assignee);
        if (!name)
          return <span className="text-muted-foreground">Unassigned</span>;
        return (
          <span className="flex min-w-0 items-center gap-2">
            <InitialsAvatar
              name={name}
              className="h-6 w-6 shrink-0 text-[10px]"
            />
            <span className="truncate">{name}</span>
          </span>
        );
      },
    },
    {
      key: 'due',
      header: 'Due',
      width: 120,
      render: (r) => {
        const state = getTaskDueState(r);
        const label = fmt.date(r.dueAt);
        if (!label)
          return <span className="text-muted-foreground">No date</span>;
        return (
          <span
            className={cn(
              'tabular-nums',
              state ? TASK_DUE_CLASS[state] : 'text-muted-foreground',
            )}
          >
            {state === 'today' ? 'Today' : label}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: 110,
      render: (r) => {
        if (r.status === 'done')
          return (
            <StatusPill tone="success" dot>
              Done
            </StatusPill>
          );
        if (getTaskDueState(r) === 'overdue')
          return (
            <StatusPill tone="danger" dot>
              Overdue
            </StatusPill>
          );
        return (
          <StatusPill tone="info" dot>
            Open
          </StatusPill>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: 56,
      align: 'center',
      render: (r) => {
        const actions = rowActions(r);
        if (actions.length === 0) return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <RowActions actions={actions} />
          </div>
        );
      },
    },
  ];

  const rows = data?.data ?? [];
  const hasFilters =
    !!debouncedSearch.trim() ||
    status !== 'open' ||
    due !== 'any' ||
    owner !== 'mine';

  const newTaskButton = canCreate ? (
    <ToolbarButton variant="primary" icon={Plus} onClick={openCreate}>
      New task
    </ToolbarButton>
  ) : undefined;

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <FilterBar end={newTaskButton}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tasks..."
        />
        <SegmentedControl
          value={owner}
          onChange={setOwner}
          options={[
            { value: 'mine', label: 'Mine' },
            { value: 'everyone', label: 'Everyone' },
          ]}
        />
        <FilterDropdown
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => setStatus(v as StatusFilter)}
        />
        <FilterDropdown
          label="Due"
          value={due}
          options={DUE_OPTIONS}
          onChange={(v) => setDue(v as DueFilter)}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <TableSkeleton />
        ) : error || rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-border">
            {error ? (
              <EmptyState
                icon={<ListTodo className="h-8 w-8" />}
                title="Could not load tasks"
                description={errorText(error, 'Please try again in a moment')}
              />
            ) : (
              <EmptyState
                icon={<ListTodo className="h-8 w-8" />}
                title={
                  hasFilters
                    ? 'No tasks match these filters'
                    : 'You are all caught up'
                }
                description={
                  hasFilters
                    ? 'Try a different search, status or due date'
                    : 'Tasks assigned to you will appear here'
                }
                action={newTaskButton}
              />
            )}
          </div>
        ) : (
          <>
            <DataGrid
              columns={columns}
              rows={rows}
              getRowId={(r) => r.id}
              onRowClick={canUpdate ? openEdit : undefined}
              pinFirstColumn
              maxHeight="100%"
              className={isFetching ? 'flex-1 opacity-70' : 'flex-1'}
            />
            <ListFooter
              page={data?.page ?? page}
              limit={LIMIT}
              total={data?.total ?? 0}
              totalPages={data?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        currentUserId={user?.userId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete task"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be removed permanently. This cannot be undone.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.TASK_LIST_READ}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to view tasks
        </div>
      }
    >
      <TasksContent />
    </PermissionGuard>
  );
}
