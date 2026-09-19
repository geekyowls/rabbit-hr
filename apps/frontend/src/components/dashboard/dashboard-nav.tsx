'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { usePermissions } from '@/hooks/use-permissions';
import {
  HomeIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PERMISSIONS_ENUM,
  PERMISSION_BASE,
} from '@/constants/permissions.constants';
import { useSidebar } from '@/contexts/sidebar-context';
import { ProtectedNavLink } from './protected-nav-link';

interface VersionInfo {
  version: string;
  gitCommit: string | null;
  buildTime: string | null;
}

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NavLeaf {
  href: string;
  label: string;
  icon: IconType;
  activeMatch?: (pathname: string) => boolean;
  requiredPermissions?: string[];
}

const NAV_ITEMS: NavLeaf[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: HomeIcon,
  },
  {
    href: '/dashboard/help',
    label: 'Help',
    icon: QuestionMarkCircleIcon,
    activeMatch: (p) => p.startsWith('/dashboard/help'),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    activeMatch: (p) => p.startsWith('/dashboard/settings'),
    requiredPermissions: [
      PERMISSIONS_ENUM.ORGANIZATION_UPDATE,
      PERMISSIONS_ENUM.ORGANIZATION_SETTINGS,
      PERMISSION_BASE.USER_LIST_READ,
    ],
  },
];

function isLeafActive(leaf: NavLeaf, pathname: string): boolean {
  return leaf.activeMatch ? leaf.activeMatch(pathname) : pathname === leaf.href;
}

export function DashboardNav() {
  const pathname = usePathname();
  const { hasAnyPermission } = usePermissions();
  const { collapsed: isCollapsed, mounted } = useSidebar();

  const { data: versionInfo } = useQuery({
    queryKey: ['version'],
    queryFn: () => fetchApi<VersionInfo>(API_ROUTES.VERSION),
    staleTime: Infinity,
  });

  const collapsed = mounted ? isCollapsed : true;

  const isLeafVisible = (leaf: NavLeaf) =>
    !leaf.requiredPermissions || hasAnyPermission(leaf.requiredPermissions);

  const renderLeaf = (leaf: NavLeaf) => {
    const isActive = isLeafActive(leaf, pathname);

    if (collapsed) {
      return (
        <TooltipProvider key={leaf.href} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <ProtectedNavLink
                href={leaf.href}
                className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-xl mx-auto relative',
                  isActive
                    ? 'bg-white/25 text-white font-medium ring-1 ring-white/20'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <leaf.icon className="h-5 w-5" />
              </ProtectedNavLink>
            </TooltipTrigger>
            <TooltipContent side="right">{leaf.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <ProtectedNavLink
        key={leaf.href}
        href={leaf.href}
        className={cn(
          'flex items-center w-full h-10 px-3 py-2 rounded-xl relative',
          isActive
            ? 'bg-white/25 text-white font-medium ring-1 ring-white/20'
            : 'text-white/70 hover:bg-white/10 hover:text-white',
        )}
      >
        <leaf.icon className="mr-3 shrink-0 h-4 w-4" />
        <span className="text-sm">{leaf.label}</span>
      </ProtectedNavLink>
    );
  };

  return (
    <nav
      className={cn(
        'hidden lg:flex lg:flex-col shrink-0 bg-gradient-to-b from-[#0e5c3e] to-[#062e1f] h-full transition-all duration-300',
        collapsed ? 'w-16' : 'w-52',
      )}
    >
      <div className="flex flex-col h-full p-3">
        <div className={cn('space-y-2', collapsed && 'space-y-1')}>
          {NAV_ITEMS.map((item) => {
            if (!isLeafVisible(item)) return null;
            return renderLeaf(item);
          })}
        </div>
        <div className="mt-auto">
          {!collapsed && (
            <div className="pt-6 border-t border-white/20 px-3">
              <span className="text-xs text-white/60">
                RabbitHR{versionInfo && ` v${versionInfo.version}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
