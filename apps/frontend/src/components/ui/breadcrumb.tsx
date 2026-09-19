'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  clients: 'Clients',
  counselling: 'Counselling',
  'follow-ups': 'Follow-ups',
  'food-database': 'Food Database',
  exercises: 'Exercise Library',
  'workout-templates': 'Workout Templates',
  'diet-templates': 'Diet Templates',
  'diet-guidelines': 'Guidelines',
  'lead-forms': 'Lead Forms',
  content: 'Content',
  notifications: 'Notifications',
  reports: 'Reports',
  settings: 'Settings',
  general: 'General',
  organization: 'Organization',
  users: 'Users',
  roles: 'Roles',
  audit: 'Audit Logs',
  sessions: 'Sessions',
  integrations: 'Integrations',
  billing: 'Billing',
  'field-mappings': 'Field Mappings',
  'form-templates': 'Form Templates',
  new: 'New',
  edit: 'Edit',
  view: 'View',
  details: 'Details',
  create: 'Create',
};

function titleCase(segment: string): string {
  return decodeURIComponent(segment)
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function Breadcrumb({ items: propItems, className }: BreadcrumbProps) {
  const pathname = usePathname();
  const computedItems: BreadcrumbItem[] = useMemo(() => {
    if (propItems && propItems.length > 0) return propItems;
    if (!pathname) return [];
    const segments = pathname.split('/').filter(Boolean);
    const filtered = segments.filter((seg) => seg !== 'dashboard');
    let path = '/dashboard';
    return filtered.map((seg, idx) => {
      path += '/' + seg;
      const label = LABEL_MAP[seg] || titleCase(seg);
      return {
        label,
        href: idx < filtered.length - 1 ? path : undefined,
        active: idx === filtered.length - 1,
      };
    });
  }, [propItems, pathname]);

  return (
    <nav
      className={cn(
        'flex items-center text-[15px] text-muted-foreground',
        className,
      )}
      aria-label="Breadcrumb"
    >
      {computedItems.map((item, idx) => (
        <span key={`${item.label}-${idx}`} className="flex items-center">
          {idx > 0 && <span className="mx-2 text-border select-none">/</span>}
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={
                item.active
                  ? 'font-semibold text-foreground tracking-tight'
                  : undefined
              }
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
