'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BuildingOffice2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_COLLAPSED_KEY = 'system-sidebar-collapsed';

interface Route {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeMatch?: (pathname: string) => boolean;
}

export function SystemNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'false') {
      setIsCollapsed(false);
    }
  }, []);

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  const routes: Route[] = [
    {
      href: '/system/organizations',
      label: 'Organizations',
      icon: BuildingOffice2Icon,
      activeMatch: (p) => p.startsWith('/system/organizations'),
    },
  ];

  const collapsed = mounted ? isCollapsed : true;

  return (
    <nav
      className={cn(
        'border-r border-border dark:border-border bg-gray-50/40 dark:bg-dark-background h-screen sticky top-0 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex flex-col h-full', collapsed ? 'p-3' : 'p-6')}>
        <div
          className={cn(
            'mb-6 flex items-center gap-3',
            collapsed ? 'justify-center' : 'px-3',
          )}
        >
          <div
            className={cn(
              'rounded bg-indigo-600 flex items-center justify-center text-white font-semibold',
              collapsed ? 'h-8 w-8 text-sm' : 'h-10 w-10',
            )}
          >
            S
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              System Admin
            </span>
          )}
        </div>
        <div className={cn('space-y-2', collapsed && 'space-y-1')}>
          {routes.map((route) => {
            const isActive = route.activeMatch
              ? route.activeMatch(pathname)
              : pathname === route.href;

            if (collapsed) {
              return (
                <TooltipProvider key={route.href} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={route.href}
                        className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-xl mx-auto',
                          isActive
                            ? 'bg-white/70 text-gray-800 shadow-sm border border-gray-200/80 border-b-2 border-b-gray-400/50 dark:bg-gradient-to-b dark:from-[#222327] dark:to-[#18191e] dark:border-none dark:text-gray-100'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-black/20 hover:text-gray-900 dark:hover:text-gray-100',
                        )}
                      >
                        <route.icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{route.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'flex items-center w-full h-10 px-3 py-2 rounded-xl',
                  isActive
                    ? 'bg-white/70 text-gray-800 font-medium shadow-sm hover:shadow-xs border border-gray-200/80 border-b-2 border-b-gray-400/50 dark:bg-gradient-to-b dark:from-[#222327] dark:to-[#18191e] dark:border-none dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-black/20 hover:text-gray-900 dark:hover:text-gray-100',
                )}
              >
                <route.icon className="mr-3 h-4 w-4 shrink-0" />
                <span className="text-sm">{route.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto">
          <div
            className={cn(
              'pt-6 border-t border-border flex items-center',
              collapsed ? 'justify-center' : 'justify-between px-3',
            )}
          >
            {!collapsed && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                System Admin
              </p>
            )}
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
