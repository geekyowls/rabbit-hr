'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { AuthGuard } from '@/components/auth/auth-guard';
import { UnsavedChangesProvider } from '@/contexts/unsaved-changes-context';
import { KeyboardProvider } from '@/contexts/keyboard-context';
import { FocusModeProvider, useFocusMode } from '@/contexts/focus-mode-context';
import { BreadcrumbProvider } from '@/contexts/breadcrumb-context';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { CommandPalette } from '@/components/common/command-palette';
import { KeyboardShortcutsHelp } from '@/components/common/keyboard-shortcuts-help';
import { IntegrationStatusPill } from '@/components/dashboard/integration-status-pill';
import { cn } from '@/lib/utils';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isFocusMode } = useFocusMode();

  return (
    <div className="h-screen bg-gray-50/10 dark:bg-dark-background flex flex-col overflow-hidden">
      {!isFocusMode && <DashboardHeader />}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {!isFocusMode && <DashboardNav />}
        <div className="flex-1 flex flex-col min-w-0">
          <main
            className={cn('flex-1 overflow-auto', isFocusMode ? 'p-2' : 'p-4')}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <KeyboardProvider>
        <UnsavedChangesProvider>
          <FocusModeProvider>
            <SidebarProvider>
              <BreadcrumbProvider>
                <DashboardLayoutInner>{children}</DashboardLayoutInner>
                <CommandPalette />
                <KeyboardShortcutsHelp />
                <IntegrationStatusPill />
              </BreadcrumbProvider>
            </SidebarProvider>
          </FocusModeProvider>
        </UnsavedChangesProvider>
      </KeyboardProvider>
    </AuthGuard>
  );
}
