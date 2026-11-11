'use client';

import { ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SourceCard({
  title,
  url,
  faviconUrl,
  onClick,
  className,
}: {
  title: string;
  url: string;
  faviconUrl?: string;
  onClick?: () => void;
  className?: string;
}) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    host = url;
  }

  const content = (
    <>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        {faviconUrl ? (
          <img src={faviconUrl} alt="" className="h-4 w-4" />
        ) : (
          <Globe className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{host}</p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </>
  );

  const base = cn(
    'flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent',
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {content}
      </button>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={base}>
      {content}
    </a>
  );
}
