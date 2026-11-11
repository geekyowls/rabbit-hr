'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { roleSchema, RoleFormData } from '@/schemas/role.schema';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { RoleForm } from '@/components/roles/role-form';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import type { Role } from '@/types/role.type';

function EditRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);

  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Roles', href: '/dashboard/settings/roles' },
    { label: 'Edit role', active: true },
  ]);
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', permissions: [] },
  });
  const { reset } = form;

  const loadRole = useCallback(async () => {
    if (!roleId) {
      toast.error('Role not found');
      router.push('/dashboard/settings/roles');
      return;
    }
    try {
      const data = await fetchApi<Role>(API_ROUTES.ROLES.GET(roleId));
      reset({ name: data.name, permissions: [...data.permissions] });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load role';
      toast.error(message);
      router.push('/dashboard/settings/roles');
    } finally {
      setIsLoading(false);
    }
  }, [roleId, router, reset]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  const onSubmit = async (formData: RoleFormData) => {
    if (!roleId) return;
    try {
      await fetchApi(API_ROUTES.ROLES.UPDATE(roleId), {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      toast.success('Role updated');
      toast.info(
        'Users with this role will be asked to re-login to apply the new permissions',
      );
      router.push('/dashboard/settings/roles');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <RoleForm
      form={form}
      title="Edit role"
      description="Rename the role or change what it can do"
      submitLabel="Save changes"
      onSubmit={onSubmit}
    />
  );
}

export default function EditRolePage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.ROLE_UPDATE}
      fallback={
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You don&apos;t have permission to edit roles
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
          </div>
        }
      >
        <EditRoleContent />
      </Suspense>
    </PermissionGuard>
  );
}
