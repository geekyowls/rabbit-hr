'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ListFooter } from '@/components/jobs/list-footer';
import {
  DataGrid,
  DetailDrawer,
  DetailPanel,
  EmptyState,
  FilterBar,
  FilterDropdown,
  PanelSection,
  SearchInput,
  StatusPill,
  type DataGridColumn,
  type PillTone,
} from '@/components/patterns';
import type { PaginatedResponse } from '@/types/common.type';

interface AuditLogActor {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface AuditLog {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  actor?: AuditLogActor | null;
  method: string;
  path: string;
  action: string;
  statusCode: number;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  duration: number | null;
  createdAt: string;
}

const LIMIT = 25;
const ALL = 'all';
const METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_TONE: Record<string, PillTone> = {
  POST: 'success',
  PUT: 'info',
  PATCH: 'warning',
  DELETE: 'danger',
};

function statusTone(code: number): PillTone {
  return code >= 200 && code < 300 ? 'success' : 'danger';
}

function getActorName(actor?: AuditLogActor | null): string {
  if (!actor) return 'System';
  const name = [actor.firstName, actor.lastName].filter(Boolean).join(' ');
  return name || actor.email;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-1.5 text-sm">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1 break-all">{children}</div>
    </div>
  );
}

export function AuditLogView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState(ALL);
  const debouncedSearch = useDebounce(search, 500);
  const [result, setResult] = useState<PaginatedResponse<AuditLog> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, method]);

  const loadLogs = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetchApi<PaginatedResponse<AuditLog>>(
        API_ROUTES.AUDIT.LIST,
        {
          method: 'POST',
          body: JSON.stringify({
            page,
            limit: LIMIT,
            ...(debouncedSearch.trim()
              ? { action: debouncedSearch.trim() }
              : {}),
            ...(method !== ALL ? { method } : {}),
          }),
        },
      );
      setResult(response);
    } catch (err: unknown) {
      toast.error(
        'Could not load audit logs',
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [page, debouncedSearch, method]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const rows = result?.data ?? [];
  const hasFilters = !!debouncedSearch.trim() || method !== ALL;

  const columns: DataGridColumn<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      width: 240,
      render: (r) => <span className="font-medium">{r.action}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      width: 200,
      render: (r) => (
        <span className="min-w-0">
          <span className="block truncate">{getActorName(r.actor)}</span>
          {r.actor?.email && (
            <span className="block truncate text-xs text-muted-foreground">
              {r.actor.email}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      width: 100,
      render: (r) => (
        <StatusPill tone={METHOD_TONE[r.method] ?? 'neutral'}>
          {r.method}
        </StatusPill>
      ),
    },
    {
      key: 'path',
      header: 'Path',
      width: 260,
      render: (r) => (
        <span className="block truncate text-xs text-muted-foreground">
          {r.path}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 90,
      render: (r) => (
        <StatusPill tone={statusTone(r.statusCode)} dot>
          {r.statusCode}
        </StatusPill>
      ),
    },
    {
      key: 'createdAt',
      header: 'Time',
      width: 140,
      render: (r) => (
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by action, e.g. users.invite"
        />
        <FilterDropdown
          label="Method"
          value={method}
          options={[
            { label: 'All', value: ALL },
            ...METHODS.map((m) => ({ label: m, value: m })),
          ]}
          onChange={setMethod}
        />
      </FilterBar>

      {isLoading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-border">
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title={
              hasFilters
                ? 'No activity matches these filters'
                : 'No activity yet'
            }
            description={
              hasFilters
                ? 'Try a different action or method'
                : 'Changes made by your team will show up here'
            }
          />
        </div>
      ) : (
        <div data-tour="audit-table">
          <DataGrid
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            onRowClick={setSelectedLog}
            pinFirstColumn
            maxHeight="calc(100vh - 16rem)"
            className={isFetching ? 'opacity-70' : undefined}
          />
          <ListFooter
            page={result?.page ?? page}
            limit={LIMIT}
            total={result?.total ?? 0}
            totalPages={result?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </div>
      )}

      <DetailDrawer
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        title={selectedLog?.action ?? 'Activity'}
        chips={
          selectedLog && (
            <StatusPill tone={statusTone(selectedLog.statusCode)} dot>
              {selectedLog.statusCode}
            </StatusPill>
          )
        }
      >
        {selectedLog && (
          <DetailPanel>
            <PanelSection title="Request">
              <div className="divide-y divide-border">
                <DetailRow label="Method">
                  <StatusPill
                    tone={METHOD_TONE[selectedLog.method] ?? 'neutral'}
                  >
                    {selectedLog.method}
                  </StatusPill>
                </DetailRow>
                <DetailRow label="Path">
                  <span className="text-xs">{selectedLog.path}</span>
                </DetailRow>
                <DetailRow label="Duration">
                  {selectedLog.duration ? `${selectedLog.duration}ms` : '-'}
                </DetailRow>
                <DetailRow label="Time">
                  {formatDateTime(selectedLog.createdAt)}
                </DetailRow>
              </div>
            </PanelSection>

            <PanelSection title="Actor">
              <div className="divide-y divide-border">
                <DetailRow label="Name">
                  {getActorName(selectedLog.actor)}
                </DetailRow>
                <DetailRow label="Email">
                  {selectedLog.actor?.email ?? '-'}
                </DetailRow>
                <DetailRow label="IP address">
                  {selectedLog.ipAddress ?? '-'}
                </DetailRow>
                {selectedLog.userAgent && (
                  <DetailRow label="User agent">
                    <span className="text-xs text-muted-foreground">
                      {selectedLog.userAgent}
                    </span>
                  </DetailRow>
                )}
              </div>
            </PanelSection>

            {selectedLog.metadata && (
              <PanelSection title="Metadata">
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </PanelSection>
            )}
          </DetailPanel>
        )}
      </DetailDrawer>
    </>
  );
}
