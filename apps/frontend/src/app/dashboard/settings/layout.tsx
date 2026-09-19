'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsIndex = pathname === '/dashboard/settings';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="space-y-6">
      {isSettingsIndex && (
        <div>
          <h2 className="text-lg font-medium">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your organization settings
          </p>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
