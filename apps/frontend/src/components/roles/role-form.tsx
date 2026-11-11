'use client';

import Link from 'next/link';
import { Controller, type UseFormReturn } from 'react-hook-form';
import type { RoleFormData } from '@/schemas/role.schema';
import { PermissionPicker } from '@/components/roles/permission-picker';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/patterns';

const ROLES_HREF = '/dashboard/settings/roles';

export function RoleForm({
  form,
  title,
  description,
  submitLabel,
  onSubmit,
}: {
  form: UseFormReturn<RoleFormData>;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (data: RoleFormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <PageHeader
        title={title}
        description={description}
        backHref={ROLES_HREF}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              asChild
            >
              <Link href={ROLES_HREF}>Cancel</Link>
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
              {submitLabel}
            </Button>
          </>
        }
      />

      <SectionCard title="Details" bodyClassName="p-4">
        <div className="max-w-md space-y-2">
          <Label htmlFor="role-name">Role name</Label>
          <Input
            id="role-name"
            placeholder="e.g. Recruiter, Hiring manager"
            disabled={isSubmitting}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Permissions"
        subtitle="Select which actions this role can perform"
        bodyClassName="p-4"
      >
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
      </SectionCard>
    </form>
  );
}
