'use client';

import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { KeyRound, UserRound } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { useSession } from '@/contexts/session-context';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { useImpersonation } from '@/hooks/use-impersonation';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/schemas/auth.schema';
import { PageHeader } from '@/components/ui/page-header';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/patterns';

interface MeProfile {
  role: { id: string; name: string } | null;
}

const PASSWORD_FIELDS: {
  name: keyof ChangePasswordFormData;
  label: string;
  autoComplete: string;
}[] = [
  {
    name: 'currentPassword',
    label: 'Current password',
    autoComplete: 'current-password',
  },
  { name: 'newPassword', label: 'New password', autoComplete: 'new-password' },
  {
    name: 'confirmPassword',
    label: 'Confirm new password',
    autoComplete: 'new-password',
  },
];

function ChangePasswordCard() {
  const { logout } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await fetchApi(API_ROUTES.AUTH.UPDATE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Password updated', 'Sign in again with your new password');
      logout();
    } catch (err: unknown) {
      toast.error(
        'Could not update password',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <SectionCard
      icon={KeyRound}
      title="Password"
      subtitle="You will be signed out of all devices after changing it"
      bodyClassName="p-4"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          {PASSWORD_FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type="password"
                autoComplete={field.autoComplete}
                disabled={isSubmitting}
                {...register(field.name)}
              />
              {errors[field.name] && (
                <p className="text-xs text-destructive">
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
            Update password
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-2 text-sm">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate">{value}</span>
    </div>
  );
}

export default function GeneralSettingsPage() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'My account', active: true },
  ]);
  const { user } = useSession();
  const { isImpersonating } = useImpersonation();
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => fetchApi<MeProfile>(API_ROUTES.USERS.ME),
  });

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-4">
      <PageHeader
        title="My account"
        description="Your profile and sign-in details"
        backHref="/dashboard/settings"
      />

      <SectionCard icon={UserRound} title="Profile" bodyClassName="p-4">
        {!user ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <InitialsAvatar
              name={fullName || user.email}
              className="h-10 w-10 text-sm"
            />
            <div className="min-w-0 flex-1 divide-y divide-border">
              <ProfileRow label="Name" value={fullName || '-'} />
              <ProfileRow label="Email" value={user.email} />
              <ProfileRow
                label="Role"
                value={meLoading ? '' : (me?.role?.name ?? 'No role')}
              />
            </div>
          </div>
        )}
      </SectionCard>

      {!isImpersonating && <ChangePasswordCard />}
    </div>
  );
}
