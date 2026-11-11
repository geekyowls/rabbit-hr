'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import {
  HomeIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ViewColumnsIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  CpuChipIcon,
} from '@heroicons/react/24/solid';
import {
  PERMISSIONS_ENUM,
  PERMISSION_BASE,
} from '@/constants/permissions.constants';
import { ProtectedNavLink } from './protected-nav-link';
import { BrandLockup } from './brand-lockup';

const routes = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: HomeIcon,
  },
  {
    href: '/dashboard/jobs',
    label: 'Jobs',
    icon: BriefcaseIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/jobs'),
  },
  {
    href: '/dashboard/clients',
    label: 'Clients',
    icon: BuildingOffice2Icon,
    activeMatch: (p: string) => p.startsWith('/dashboard/clients'),
  },
  {
    href: '/dashboard/candidates',
    label: 'Candidates',
    icon: UserGroupIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/candidates'),
  },
  {
    href: '/dashboard/pipeline',
    label: 'Pipeline',
    icon: ViewColumnsIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/pipeline'),
  },
  {
    href: '/dashboard/tasks',
    label: 'Tasks',
    icon: ClipboardDocumentCheckIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/tasks'),
  },
  {
    href: '/dashboard/interviews',
    label: 'Interviews',
    icon: CalendarDaysIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/interviews'),
  },
  {
    href: '/dashboard/offers',
    label: 'Offers',
    icon: DocumentCheckIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/offers'),
  },
  {
    href: '/dashboard/reports',
    label: 'Reports',
    icon: ChartBarIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/reports'),
  },
  {
    href: '/dashboard/agents',
    label: 'Agents',
    icon: CpuChipIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/agents'),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    activeMatch: (p: string) => p.startsWith('/dashboard/settings'),
    requiredPermissions: [
      PERMISSIONS_ENUM.ORGANIZATION_UPDATE,
      PERMISSIONS_ENUM.ORGANIZATION_SETTINGS,
      PERMISSION_BASE.USER_LIST_READ,
    ],
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { hasAnyPermission } = usePermissions();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8 text-gray-700 dark:text-gray-200"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-gradient-to-b from-[#4a7d68] to-[#1d3129] border-0 [&>button]:text-white/60 [&>button]:hover:text-white"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center gap-2 px-4 py-4 border-b border-white/20">
            <BrandLockup variant="onDark" />
          </div>

          <nav className="p-3 space-y-1 pt-4">
            {routes.map((route) => {
              if (
                route.requiredPermissions &&
                !hasAnyPermission(route.requiredPermissions)
              ) {
                return null;
              }
              const isActive = route.activeMatch
                ? route.activeMatch(pathname)
                : pathname === route.href;

              return (
                <ProtectedNavLink
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'flex items-center w-full h-10 px-3 py-2 rounded-xl',
                    isActive
                      ? 'bg-white/25 text-white font-medium ring-1 ring-white/20'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <route.icon className="mr-3 h-4 w-4 shrink-0" />
                  <span className="text-sm">{route.label}</span>
                </ProtectedNavLink>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
