'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/contexts/session-context';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useImpersonation } from '@/hooks/use-impersonation';
import { useSystemAdminAccess } from '@/hooks/use-system-admin-access';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useBreadcrumbContext } from '@/contexts/breadcrumb-context';
import { useSidebar } from '@/contexts/sidebar-context';
import { Keyboard, Search, LogOut } from 'lucide-react';
import { DisplaySettings } from '@/components/common/display-settings';
import { KeyboardShortcutsHelp } from '@/components/common/keyboard-shortcuts-help';
import { MobileNav } from './mobile-nav';
import { NotificationsBell } from './notifications-bell';
import { BrandLockup } from './brand-lockup';

export function DashboardHeader() {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useSession();
  const { theme, setTheme } = useTheme();
  const { isImpersonating, stopImpersonation } = useImpersonation();
  const { isInSystemAdminMode, exitSystemAdminAccess } = useSystemAdminAccess();
  const { items: breadcrumbItems } = useBreadcrumbContext();
  const { toggle: toggleSidebar } = useSidebar();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-dark-background dark:text-dark-text">
      {isInSystemAdminMode && (
        <div className="flex items-center justify-between bg-violet-500 px-6 py-2 text-sm font-medium text-white">
          <span>
            System Admin Access - Viewing organization as administrator
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={exitSystemAdminAccess}
            className="h-7 shrink-0 border-2 border-white/40 bg-white text-violet-700 hover:bg-violet-100 hover:text-violet-800"
          >
            Exit to System Admin
          </Button>
        </div>
      )}
      {isImpersonating && (
        <div className="flex items-center justify-between bg-amber-500 px-6 py-2 text-sm font-medium text-black dark:text-black">
          <span>You are impersonating {user?.firstName || user?.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={stopImpersonation}
            className="h-7 shrink-0 border-2 border-black/40 bg-black text-white hover:bg-zinc-800 hover:text-white dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:hover:text-black"
          >
            Exit Impersonation
          </Button>
        </div>
      )}
      <div className="flex h-16 items-center justify-between pl-3 pr-6 shadow-sm">
        <div className="flex items-center gap-3">
          <MobileNav />
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <BrandLockup variant="onLight" />
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="hidden sm:flex">
            <Breadcrumb
              items={breadcrumbItems.length > 0 ? breadcrumbItems : undefined}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border rounded-md cursor-pointer hover:bg-muted transition-colors"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('open-command-palette'))
            }
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-auto text-xs bg-background px-1.5 py-0.5 rounded border font-mono">
              ⌘K
            </kbd>
          </div>
          <DisplaySettings />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative h-7 w-14 rounded-full border border-transparent bg-zinc-100 dark:bg-zinc-800 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <div className="absolute left-0 top-0 flex h-full w-full items-center justify-between px-1.5">
              <SunIcon className="h-3.5 w-3.5 text-zinc-800 dark:text-zinc-200" />
              <MoonIcon className="h-3.5 w-3.5 text-zinc-800 dark:text-zinc-200" />
            </div>
            <div
              suppressHydrationWarning
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50 transition-transform duration-200 ease-in-out ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </Button>
          {user && <NotificationsBell />}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <div className="h-8 w-8 rounded-full bg-[#3F6650] dark:bg-[#3F6650] flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {user.firstName || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
                  <Keyboard className="h-4 w-4 mr-2" />
                  Keyboard Shortcuts
                  <span className="ml-auto text-xs text-muted-foreground">
                    ?
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} disabled={isLoggingOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <KeyboardShortcutsHelp
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </header>
  );
}
