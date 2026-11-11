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
  EmptyState,
  RowActions,
  SegmentedControl,
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

  const visibleCategories = EMAIL_TEMPLATE_CATEGORIES.filter(
    (c) => category === 'all' || c === category,
  );
  const groups = visibleCategories
    .map((c) => ({
      category: c,
      items: templates.filter((t) => t.category === c),
    }))
    .filter((g) => g.items.length > 0);

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
        description="Reusable emails for candidates, with merge fields filled in when sent"
        backHref="/dashboard/settings"
        actions={
          canManage ? (
            <ToolbarButton variant="primary" icon={Plus} onClick={openCreate}>
              New template
            </ToolbarButton>
          ) : undefined
        }
      />

      <div className="overflow-x-auto">
        <SegmentedControl
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: `All ${templates.length}` },
            ...EMAIL_TEMPLATE_CATEGORIES.map((c) => ({
              value: c,
              label: `${CATEGORY_LABEL[c]} ${counts[c]}`,
            })),
          ]}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="Could not load templates"
          description={error.message || 'Please try again in a moment'}
        />
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={<Mail className="h-8 w-8" />}
            title={
              category === 'all'
                ? 'No templates yet'
                : `No ${CATEGORY_LABEL[category].toLowerCase()} templates`
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
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.category} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[group.category]}
              </h3>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {group.items.map((template) => {
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
                    <li
                      key={template.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                    >
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => openEdit(template)}
                        className="min-w-0 flex-1 text-left disabled:cursor-default"
                      >
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {template.name}
                          </p>
                          <StatusPill tone={CATEGORY_TONE[template.category]}>
                            {CATEGORY_LABEL[template.category]}
                          </StatusPill>
                          {template.isDefault && (
                            <StatusPill tone="success">Default</StatusPill>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {template.subject}
                        </p>
                      </button>
                      {actions.length > 0 && <RowActions actions={actions} />}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
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
