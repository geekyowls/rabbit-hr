'use client';

import { useSession } from '@/contexts/session-context';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';

function GeneralSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

export default function GeneralSettingsPage() {
  const { user } = useSession();

  if (!user) {
    return <GeneralSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="General" backHref="/dashboard/settings" />
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-medium">Account</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Name</span>
            <span>
              {user?.firstName || ''} {user?.lastName || ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
