'use client';

import { SystemHeader } from '@/components/system/system-header';
import { SystemNav } from '@/components/system/system-nav';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireSystemOrg>
      <div className="min-h-screen bg-gray-50/10 dark:bg-dark-background flex">
        <SystemNav />
        <div className="flex-1 flex flex-col">
          <SystemHeader />
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
