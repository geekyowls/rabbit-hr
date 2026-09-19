'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  backHref?: string;
}

const backButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors';

export function PageHeader({
  title,
  description,
  actions,
  onBack,
  backHref,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-0">
        {backHref ? (
          <Link href={backHref} aria-label="Back" className={backButtonClass}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className={backButtonClass}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
        <div className="flex flex-col min-w-0">
          <h2 className="text-xl font-semibold tracking-tight truncate">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
