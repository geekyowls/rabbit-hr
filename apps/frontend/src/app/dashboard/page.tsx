'use client';

import { useSession } from '@/contexts/session-context';

export default function DashboardPage() {
  const { user } = useSession();

  return (
    <div className="space-y-8 container mx-auto dark:text-dark-text">
      <div className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your dashboard overview
        </p>
      </div>
    </div>
  );
}
