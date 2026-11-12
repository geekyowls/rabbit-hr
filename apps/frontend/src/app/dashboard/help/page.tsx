'use client';

import { BookOpen, Bug, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPO_URL = 'https://github.com/geekyowls/rabbit-hr';

const LINKS = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Setup guide, features and how things work',
    href: `${REPO_URL}#readme`,
    action: 'Read docs',
  },
  {
    icon: Bug,
    title: 'Report a problem',
    description: 'Found a bug or have an idea? Open an issue',
    href: `${REPO_URL}/issues/new/choose`,
    action: 'Open issue',
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Help and support</h1>
        <p className="text-sm text-muted-foreground">
          Guides and the quickest way to reach the team
        </p>
      </div>
      <div className="max-w-xl divide-y rounded-lg border bg-card">
        {LINKS.map(({ icon: Icon, title, description, href, action }) => (
          <div
            key={title}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href={href} target="_blank" rel="noreferrer">
                {action}
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
