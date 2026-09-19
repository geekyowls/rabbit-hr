'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { roleSchema, RoleFormData } from '@/schemas/role.schema';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PermissionPicker } from '@/components/roles/permission-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/page-header';
import Link from 'next/link';
import type { Role } from '@/types/role.type';

function EditRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', permissions: [] },
  });

  const loadRole = useCallback(async () => {
    if (!roleId) {
      toast.error('Role ID is required');
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
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Edit Role" backHref="/dashboard/settings/roles" />

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="role-name">Role Name</Label>
          <Input
            id="role-name"
            placeholder="e.g. Editor, Viewer, Manager"
            disabled={isSubmitting}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label>Permissions</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select which actions this role can perform
            </p>
          </div>
          <Controller
            name="permissions"
            control={control}
            render={({ field }) => (
              <PermissionPicker
                selected={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Update Role'}
          </Button>
          <Link href="/dashboard/settings/roles">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
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
          <div className="max-w-4xl space-y-6">
            <Skeleton className="h-8 w-48" />
          </div>
        }
      >
        <EditRoleContent />
      </Suspense>
    </PermissionGuard>
  );
}
