'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table';
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
import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DataTable,
  DataTablePagination,
  EmptyState,
  FilterBar,
  FilterDropdown,
  RowActions,
  SegmentedControl,
  StatusPill,
  ToolbarButton,
  type RowAction,
} from '@/components/patterns';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import {
  TASK_DUE_CLASS,
  formatTaskDue,
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
  const { user } = useSession();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS_ENUM.TASK_CREATE);
  const canUpdate = hasPermission(PERMISSIONS_ENUM.TASK_UPDATE);
  const canDelete = hasPermission(PERMISSIONS_ENUM.TASK_DELETE);

  const [owner, setOwner] = useState<Owner>('mine');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [due, setDue] = useState<DueFilter>('any');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const params: ListTasksRequest = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(owner === 'mine' && { mine: true }),
    ...(status !== 'all' && { status }),
    ...(due !== 'any' && { due }),
  };

  const { data, isLoading, isFetching, error } = useTasksQuery(params);
  const completeTask = useCompleteTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

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
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<Task>[] = [
    {
      id: 'title',
      header: 'Task',
      cell: ({ row }) => (
        <div className="min-w-0 max-w-md">
          <p
            className={cn(
              'truncate font-medium',
              row.original.status === 'done' &&
                'text-muted-foreground line-through',
            )}
          >
            {row.original.title}
          </p>
          {row.original.description && (
            <p className="truncate text-xs text-muted-foreground">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'linked',
      header: 'Linked to',
      cell: ({ row }) => {
        const label = taskLinkLabel(row.original);
        const href = taskLinkHref(row.original);
        if (!label) return <span className="text-muted-foreground">None</span>;
        return href ? (
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="text-sm hover:underline"
          >
            {label}
          </Link>
        ) : (
          <span className="text-sm">{label}</span>
        );
      },
    },
    {
      id: 'assignee',
      header: 'Assignee',
      cell: ({ row }) => {
        const name = userDisplayName(row.original.assignee);
        if (!name)
          return <span className="text-muted-foreground">Unassigned</span>;
        return (
          <span className="flex items-center gap-2">
            <InitialsAvatar name={name} className="h-6 w-6 text-[10px]" />
            <span className="truncate text-sm">{name}</span>
          </span>
        );
      },
    },
    {
      id: 'due',
      header: 'Due',
      cell: ({ row }) => {
        const state = getTaskDueState(row.original);
        const label = formatTaskDue(row.original.dueAt);
        if (!label)
          return <span className="text-muted-foreground">No date</span>;
        return (
          <span
            className={cn(
              'tabular-nums text-sm',
              state ? TASK_DUE_CLASS[state] : 'text-muted-foreground',
            )}
          >
            {state === 'today' ? 'Today' : label}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const state = getTaskDueState(row.original);
        if (row.original.status === 'done')
          return (
            <StatusPill tone="success" dot>
              Done
            </StatusPill>
          );
        if (state === 'overdue')
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
      id: 'actions',
      header: '',
      size: 48,
      cell: ({ row }) => {
        const task = row.original;
        const actions: RowAction[] = [];
        if (canUpdate && task.status === 'open') {
          actions.push({
            label: 'Mark done',
            icon: <CheckCircle2 className="h-4 w-4" />,
            onSelect: () => handleComplete(task),
          });
        }
        if (canUpdate && task.status === 'done') {
          actions.push({
            label: 'Reopen',
            icon: <RotateCcw className="h-4 w-4" />,
            onSelect: () => handleReopen(task),
          });
        }
        if (canUpdate) {
          actions.push({
            label: 'Edit',
            icon: <Pencil className="h-4 w-4" />,
            onSelect: () => openEdit(task),
          });
        }
        if (canDelete) {
          actions.push({
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            onSelect: () => setDeleteTarget(task),
            destructive: true,
          });
        }
        if (actions.length === 0) return null;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex justify-end"
          >
            <RowActions actions={actions} />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  if (isLoading && !data) {
    return <ListPageSkeleton filters={3} />;
  }

  const total = data?.total ?? 0;
  const hasFilters = status !== 'open' || due !== 'any' || owner !== 'mine';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Follow-ups across candidates, jobs and clients
          </p>
        </div>
        {canCreate && (
          <ToolbarButton variant="primary" icon={Plus} onClick={openCreate}>
            New task
          </ToolbarButton>
        )}
      </div>

      <FilterBar>
        <SegmentedControl
          value={owner}
          onChange={(v) => {
            setOwner(v);
            resetPage();
          }}
          options={[
            { value: 'mine', label: 'Mine' },
            { value: 'everyone', label: 'Everyone' },
          ]}
        />
        <FilterDropdown
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => {
            setStatus(v as StatusFilter);
            resetPage();
          }}
        />
        <FilterDropdown
          label="Due"
          value={due}
          options={DUE_OPTIONS}
          onChange={(v) => {
            setDue(v as DueFilter);
            resetPage();
          }}
        />
      </FilterBar>

      {error ? (
        <EmptyState
          icon={<ListTodo className="h-8 w-8" />}
          title="Could not load tasks"
          description={errorText(error, 'Please try again in a moment')}
        />
      ) : total === 0 && !isFetching ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={<ListTodo className="h-8 w-8" />}
            title={
              hasFilters
                ? 'No tasks match these filters'
                : 'You are all caught up'
            }
            description={
              hasFilters
                ? 'Try a different status or due date'
                : 'Tasks assigned to you will appear here'
            }
            action={
              canCreate ? (
                <ToolbarButton
                  variant="primary"
                  icon={Plus}
                  onClick={openCreate}
                >
                  New task
                </ToolbarButton>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div>
          <div className="rounded-lg border border-border bg-card">
            <DataTable
              table={table}
              isLoading={isFetching && !data}
              onRowClick={canUpdate ? openEdit : undefined}
              getRowClassName={() => (canUpdate ? 'cursor-pointer' : '')}
              emptyMessage="No tasks found"
            />
          </div>
          <DataTablePagination
            table={table}
            totalItems={total}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        currentUserId={user?.userId}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; will be removed permanently.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
