'use client';

import { useRouter } from 'next/navigation';
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
import { toast } from '@/lib/toast';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';

function CreateRoleContent() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', permissions: [] },
  });

  const onSubmit = async (formData: RoleFormData) => {
    try {
      await fetchApi(API_ROUTES.ROLES.CREATE, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('Role created');
      router.push('/dashboard/settings/roles');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create role';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Create Role" backHref="/dashboard/settings/roles" />

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
            render={({ field: { value, onChange } }) => (
              <PermissionPicker
                selected={value}
                onChange={onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Role'}
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

export default function CreateRolePage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.ROLE_CREATE}
      fallback={
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You don&apos;t have permission to create roles
        </div>
      }
    >
      <CreateRoleContent />
    </PermissionGuard>
  );
}
