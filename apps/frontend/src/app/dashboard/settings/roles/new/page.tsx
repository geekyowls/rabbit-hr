'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { roleSchema, RoleFormData } from '@/schemas/role.schema';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { RoleForm } from '@/components/roles/role-form';
import { toast } from '@/lib/toast';

function CreateRoleContent() {
  const router = useRouter();

  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Roles', href: '/dashboard/settings/roles' },
    { label: 'New role', active: true },
  ]);
  const form = useForm<RoleFormData>({
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
    <RoleForm
      form={form}
      title="New role"
      description="Name the role and choose what it can do"
      submitLabel="Create role"
      onSubmit={onSubmit}
    />
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
