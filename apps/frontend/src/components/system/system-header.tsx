'use client';

import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/session-context';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { DisplaySettings } from '@/components/common/display-settings';

export function SystemHeader() {
  const { user, logout, isLoggingOut } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border dark:border-border bg-white dark:bg-dark-background dark:text-dark-text">
      <div className="flex h-16 items-center justify-between px-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            System Administration
          </span>
        </div>
        <div className="flex items-center space-x-6">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {(user.email?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {user.firstName || user.email}
              </span>
            </div>
          )}
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

          {user && (
            <Button
              variant="outline"
              onClick={logout}
              disabled={isLoggingOut}
              className="border-zinc-900 dark:border-zinc-700 bg-white dark:bg-gray-950 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                'Logout'
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
