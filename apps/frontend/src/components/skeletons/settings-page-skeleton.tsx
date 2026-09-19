'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SETTINGS_CARDS = [
  { title: 'General', description: 'Account information and profile settings' },
  { title: 'Users', description: 'Manage team members and invitations' },
  { title: 'Roles', description: 'Configure roles and permissions' },
  {
    title: 'Audit Logs',
    description: 'Track all actions in your organization',
  },
  { title: 'Integrations', description: 'Connect third-party services' },
];

/** Skeleton that matches Settings page: real card titles and descriptions; skeleton icon */
export function SettingsPageSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {SETTINGS_CARDS.map((card) => (
        <Card key={card.title} className="h-full opacity-90">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg animate-pulse" />
              <div>
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
