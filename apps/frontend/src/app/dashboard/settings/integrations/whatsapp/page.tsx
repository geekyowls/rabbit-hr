'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  hasIntegrationCapability,
  useDeleteWhatsappTemplateMutation,
  useIntegrationCapabilities,
  useSyncWhatsappTemplatesMutation,
  useWhatsappTemplatesQuery,
} from '@/hooks/queries';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  EmptyState,
  RowActions,
  StatusPill,
  ToolbarButton,
  type PillTone,
} from '@/components/patterns';
import {
  AddWhatsappTemplateDialog,
  WhatsappMappingDialog,
  mappedCount,
} from '@/components/integrations/whatsapp-template-dialogs';
import type { WhatsappTemplate } from '@/types/whatsapp.type';

const STATUS_TONE: Record<string, PillTone> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  PAUSED: 'warning',
  DISABLED: 'neutral',
};

function statusLabel(status: string) {
  const lower = status.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function TemplateRow({
  template,
  onMap,
  onDelete,
}: {
  template: WhatsappTemplate;
  onMap: (t: WhatsappTemplate) => void;
  onDelete: (t: WhatsappTemplate) => void;
}) {
  const fmt = useFormatters();
  const total = template.variableKeys.length;
  const mapped = mappedCount(template);
  return (
    <TableRow>
      <TableCell className="max-w-[320px]">
        <p className="truncate font-medium">
          {template.label || template.name}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {template.name}
        </p>
        {template.body && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {template.body}
          </p>
        )}
      </TableCell>
      <TableCell className="text-sm uppercase text-muted-foreground">
        {template.language}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {template.category ? statusLabel(template.category) : '-'}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {template.status ? (
            <StatusPill tone={STATUS_TONE[template.status] ?? 'neutral'} dot>
              {statusLabel(template.status)}
            </StatusPill>
          ) : (
            <StatusPill tone="neutral">Unknown</StatusPill>
          )}
          {template.addedManually && (
            <StatusPill tone="info">Manual</StatusPill>
          )}
          {!template.availableAtProvider && !template.addedManually && (
            <StatusPill tone="warning">Missing at provider</StatusPill>
          )}
        </div>
        {template.unsupportedReason && (
          <p className="mt-1 text-xs text-destructive">
            {template.unsupportedReason}
          </p>
        )}
      </TableCell>
      <TableCell>
        {total === 0 ? (
          <span className="text-sm text-muted-foreground">None</span>
        ) : (
          <StatusPill tone={mapped === total ? 'success' : 'warning'}>
            {mapped}/{total} mapped
          </StatusPill>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {template.lastSyncedAt ? fmt.relative(template.lastSyncedAt) : '-'}
      </TableCell>
      <TableCell className="w-10">
        <RowActions
          actions={[
            { label: 'Map variables', onSelect: () => onMap(template) },
            {
              label: 'Delete',
              onSelect: () => onDelete(template),
              destructive: true,
            },
          ]}
        />
      </TableCell>
    </TableRow>
  );
}

function WhatsappTemplatesContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Integrations', href: '/dashboard/settings/integrations' },
    { label: 'WhatsApp templates', active: true },
  ]);
  const { hasPermission } = usePermissions();
  const { data: capabilities, isLoading: capsLoading } =
    useIntegrationCapabilities();
  const connected = hasIntegrationCapability(capabilities, 'whatsapp');
  const { data, isLoading } = useWhatsappTemplatesQuery(connected);
  const sync = useSyncWhatsappTemplatesMutation();
  const remove = useDeleteWhatsappTemplateMutation();
  const [addOpen, setAddOpen] = useState(false);
  const [mapping, setMapping] = useState<WhatsappTemplate | null>(null);
  const [deleting, setDeleting] = useState<WhatsappTemplate | null>(null);

  const syncNow = async () => {
    try {
      const templates = await sync.mutateAsync();
      toast.success(
        'Templates synced',
        templates.length === 1
          ? '1 template found'
          : `${templates.length} templates found`,
      );
    } catch (err) {
      toast.error(
        'Could not sync templates',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success('Template removed');
    } catch (err) {
      toast.error(
        'Could not remove template',
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setDeleting(null);
    }
  };

  const templates = data?.templates ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp templates"
        description="Approved templates recruiters can send to candidates"
        backHref="/dashboard/settings/integrations"
        actions={
          connected && (
            <>
              <ToolbarButton icon={Plus} onClick={() => setAddOpen(true)}>
                Add manually
              </ToolbarButton>
              <ToolbarButton
                variant="primary"
                icon={RefreshCw}
                onClick={syncNow}
                disabled={sync.isPending}
              >
                {sync.isPending ? 'Syncing' : 'Sync from WhatsApp'}
              </ToolbarButton>
            </>
          )
        }
      />

      {capsLoading || (connected && isLoading) ? (
        <Skeleton className="h-64 w-full" />
      ) : !connected ? (
        <div className="rounded-md border border-border bg-card">
          <EmptyState
            icon={<MessageCircle className="h-8 w-8" />}
            title="WhatsApp is not connected"
            description="Connect WhatsApp in integrations to sync and manage message templates"
            action={
              hasPermission(PERMISSIONS_ENUM.INTEGRATION_CONNECT) ? (
                <Button asChild size="sm">
                  <Link href="/dashboard/settings/integrations">
                    Go to integrations
                  </Link>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-md border border-border bg-card">
          <EmptyState
            icon={<MessageCircle className="h-8 w-8" />}
            title="No templates yet"
            description="Sync approved templates from WhatsApp or add one manually"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Last synced</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  onMap={setMapping}
                  onDelete={setDeleting}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddWhatsappTemplateDialog open={addOpen} onOpenChange={setAddOpen} />
      <WhatsappMappingDialog
        template={mapping}
        onOpenChange={(o) => !o && setMapping(null)}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove template</AlertDialogTitle>
            <AlertDialogDescription>
              Recruiters can no longer send this template. It stays approved in
              WhatsApp and comes back on the next sync if it still exists there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function WhatsappTemplatesPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to manage WhatsApp templates
        </div>
      }
    >
      <WhatsappTemplatesContent />
    </PermissionGuard>
  );
}
