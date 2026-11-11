'use client';

import { useState } from 'react';
import { Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import {
  useDeleteEmailTemplateMutation,
  useEmailTemplatesQuery,
} from '@/hooks/queries';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
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
  CategoryChips,
  EmptyState,
  RowActions,
  SearchInput,
  StatusPill,
  ToolbarButton,
  type RowAction,
} from '@/components/patterns';
import { EmailTemplateDialog } from '@/components/email-templates/email-template-dialog';
import {
  CATEGORY_LABEL,
  CATEGORY_TONE,
} from '@/components/email-templates/email-template-utils';
import {
  EMAIL_TEMPLATE_CATEGORIES,
  type EmailTemplate,
  type EmailTemplateCategory,
} from '@/types/email-template.type';

type CategoryFilter = EmailTemplateCategory | 'all';

function EmailTemplatesContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Email templates', active: true },
  ]);
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS_ENUM.EMAIL_TEMPLATE_MANAGE);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  const { data: templates = [], isLoading, error } = useEmailTemplatesQuery();
  const deleteTemplate = useDeleteEmailTemplateMutation();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (template: EmailTemplate) => {
    setEditing(template);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      toast.success('Template deleted');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not delete template',
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const query = search.trim().toLowerCase();
  const visible = templates.filter(
    (t) =>
      (category === 'all' || t.category === category) &&
      (!query || `${t.name} ${t.subject}`.toLowerCase().includes(query)),
  );

  const counts = Object.fromEntries(
    EMAIL_TEMPLATE_CATEGORIES.map((c) => [
      c,
      templates.filter((t) => t.category === c).length,
    ]),
  ) as Record<EmailTemplateCategory, number>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Email templates"
        backHref="/dashboard/settings"
        actions={
          canManage ? (
            <ToolbarButton variant="primary" icon={Plus} onClick={openCreate}>
              New template
            </ToolbarButton>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search templates"
          className="w-full sm:w-64"
        />
        <CategoryChips
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: 'All', count: templates.length },
            ...EMAIL_TEMPLATE_CATEGORIES.filter(
              (c) => counts[c] > 0 || c === category,
            ).map((c) => ({
              value: c,
              label: CATEGORY_LABEL[c],
              count: counts[c],
            })),
          ]}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="Could not load templates"
          description={error.message || 'Please try again in a moment'}
        />
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={<Mail className="h-8 w-8" />}
            title={
              templates.length === 0 ? 'No templates yet' : 'No templates match'
            }
            description="Create a template to send consistent emails from the pipeline"
            action={
              canManage ? (
                <ToolbarButton
                  variant="primary"
                  icon={Plus}
                  onClick={openCreate}
                >
                  New template
                </ToolbarButton>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((template) => {
            const actions: RowAction[] = canManage
              ? [
                  {
                    label: 'Edit',
                    icon: <Pencil className="h-4 w-4" />,
                    onSelect: () => openEdit(template),
                  },
                  {
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" />,
                    onSelect: () => setDeleteTarget(template),
                    destructive: true,
                  },
                ]
              : [];
            return (
              <div
                key={template.id}
                className="flex h-full flex-col rounded-md border bg-card p-4 transition-colors hover:border-[#3F6650]/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => openEdit(template)}
                    className="min-w-0 flex-1 text-left disabled:cursor-default"
                  >
                    <p className="truncate text-sm font-semibold">
                      {template.name}
                    </p>
                    <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">
                      {template.subject}
                    </p>
                  </button>
                  {actions.length > 0 && <RowActions actions={actions} />}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                  <StatusPill tone={CATEGORY_TONE[template.category]}>
                    {CATEGORY_LABEL[template.category]}
                  </StatusPill>
                  {template.isDefault && (
                    <StatusPill tone="success">Default</StatusPill>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EmailTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editing}
        defaultCategory={category === 'all' ? 'general' : category}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; will be removed for everyone in
              your organisation. This cannot be undone.
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

export default function EmailTemplatesPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.EMAIL_TEMPLATE_READ}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to view email templates
        </div>
      }
    >
      <EmailTemplatesContent />
    </PermissionGuard>
  );
}
