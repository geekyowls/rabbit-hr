'use client';

import { PlanFeature } from '@boilerplate/shared';
import { PlanFeatureGate } from '@/components/billing/plan-feature-gate';
import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ListPlus,
  Pencil,
  Plus,
  Power,
  Trash2,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import {
  useCustomFieldsQuery,
  useDeleteCustomFieldMutation,
  useReorderCustomFieldsMutation,
  useUpdateCustomFieldMutation,
} from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
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
import { errorMessage } from '@/components/applications/application-meta';
import { CustomFieldDialog } from '@/components/custom-fields/custom-field-dialog';
import { CUSTOM_FIELD_TYPE_LABEL } from '@/components/custom-fields/custom-field-utils';
import type {
  CustomFieldDefinition,
  CustomFieldEntity,
} from '@/types/custom-field.type';

const ENTITY_LABEL: Record<CustomFieldEntity, string> = {
  candidate: 'Candidate',
  job: 'Job',
};

function CustomFieldsContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Custom fields', active: true },
  ]);
  const [entity, setEntity] = useState<CustomFieldEntity>('candidate');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<CustomFieldDefinition | null>(null);

  const {
    data: fields = [],
    isLoading,
    error,
  } = useCustomFieldsQuery({
    entity,
  });
  const updateField = useUpdateCustomFieldMutation();
  const deleteField = useDeleteCustomFieldMutation();
  const reorder = useReorderCustomFieldsMutation();
  const sorted = [...fields].sort((a, b) => a.order - b.order);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (field: CustomFieldDefinition) => {
    setEditing(field);
    setDialogOpen(true);
  };

  const moveField = async (from: number, to: number) => {
    if (to < 0 || to >= sorted.length) return;
    const ids = sorted.map((f) => f.id);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    try {
      await reorder.mutateAsync({ entity, ids });
    } catch (err) {
      toast.error('Could not reorder fields', errorMessage(err));
    }
  };

  const toggleActive = async (field: CustomFieldDefinition) => {
    try {
      await updateField.mutateAsync({
        id: field.id,
        data: { isActive: !field.isActive },
      });
      toast.success(field.isActive ? 'Field deactivated' : 'Field activated');
    } catch (err) {
      toast.error('Could not update field', errorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteField.mutateAsync(deleteTarget.id);
      toast.success(
        result.deactivated
          ? 'Field has values, so it was deactivated'
          : 'Field deleted',
      );
    } catch (err) {
      toast.error('Could not delete field', errorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Custom fields"
        description="Extra details captured on candidates and jobs"
        backHref="/dashboard/settings"
        actions={
          <ToolbarButton variant="primary" icon={Plus} onClick={openCreate}>
            New field
          </ToolbarButton>
        }
      />

      <SegmentedControl
        value={entity}
        onChange={setEntity}
        options={(['candidate', 'job'] as CustomFieldEntity[]).map((e) => ({
          value: e,
          label: ENTITY_LABEL[e],
        }))}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Could not load fields"
          description={error.message || 'Please try again in a moment'}
        />
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={<ListPlus className="h-8 w-8" />}
            title={`No ${ENTITY_LABEL[entity].toLowerCase()} fields yet`}
            description="Add fields to capture details your team needs"
            action={
              <ToolbarButton variant="primary" icon={Plus} onClick={openCreate}>
                New field
              </ToolbarButton>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {sorted.map((field, index) => {
            const actions: RowAction[] = [
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onSelect: () => openEdit(field),
              },
              {
                label: field.isActive ? 'Deactivate' : 'Activate',
                icon: <Power className="h-4 w-4" />,
                onSelect: () => toggleActive(field),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                onSelect: () => setDeleteTarget(field),
                destructive: true,
              },
            ];
            return (
              <li
                key={field.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
              >
                <button
                  type="button"
                  onClick={() => openEdit(field)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {field.label}
                    </p>
                    <StatusPill tone="info">
                      {CUSTOM_FIELD_TYPE_LABEL[field.type]}
                    </StatusPill>
                    {field.required && (
                      <StatusPill tone="warning">Required</StatusPill>
                    )}
                    {field.showOnCareersForm && (
                      <StatusPill tone="purple">Careers form</StatusPill>
                    )}
                    {!field.isActive && (
                      <StatusPill tone="neutral">Inactive</StatusPill>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {field.key}
                    {field.options.length > 0 &&
                      ` · ${field.options.join(', ')}`}
                  </p>
                </button>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => moveField(index, index - 1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === sorted.length - 1 || reorder.isPending}
                    onClick={() => moveField(index, index + 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <RowActions actions={actions} />
              </li>
            );
          })}
        </ul>
      )}

      <CustomFieldDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entity={entity}
        field={editing}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete field</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.label}&quot; will be removed. If any records
              already have a value for it, the field is deactivated instead so
              no data is lost.
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

export default function CustomFieldsPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to manage custom fields
        </div>
      }
    >
      <PlanFeatureGate feature={PlanFeature.CUSTOM_FIELDS}>
        <CustomFieldsContent />
      </PlanFeatureGate>
    </PermissionGuard>
  );
}
