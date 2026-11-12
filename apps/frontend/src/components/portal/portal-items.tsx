'use client';

import Link from 'next/link';
import {
  CalendarPlus,
  ChevronRight,
  Clock,
  FileSignature,
  FileUp,
  MapPin,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/patterns';
import {
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_TYPE_LABEL,
  formatDuration,
} from '@/components/interviews/interview-data';
import { DOCUMENT_TYPE_LABEL } from '@/components/applications/application-meta';
import type {
  PortalApplication,
  PortalBookingLink,
  PortalDocumentRequest,
  PortalInterview,
  PortalOffer,
} from '@/types/portal.type';
import {
  OFFER_STATUS_META,
  PORTAL_STATUS_TONE,
  applicationHref,
  bookingHref,
  offerHref,
  offerPay,
  portalDate,
  portalDateTime,
  portalDay,
} from './portal-utils';

export function PortalCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-card', className)}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PortalList({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-border">{children}</ul>;
}

export function PortalEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function PortalStatusPill({
  application,
}: {
  application: Pick<PortalApplication, 'status' | 'statusLabel'>;
}) {
  return (
    <StatusPill tone={PORTAL_STATUS_TONE[application.status]} dot>
      {application.statusLabel}
    </StatusPill>
  );
}

export function ApplicationItem({
  application,
}: {
  application: PortalApplication;
}) {
  return (
    <li>
      <Link
        href={applicationHref(application.id)}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium',
              application.isClosed && 'text-muted-foreground',
            )}
          >
            {application.jobTitle}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[
              application.jobLocation,
              `Applied ${portalDate(application.appliedAt)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <PortalStatusPill application={application} />
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}

export function InterviewItem({
  interview,
  brand,
}: {
  interview: PortalInterview;
  brand: string;
}) {
  const day = portalDay(interview.scheduledAt);
  const cancelled = interview.status === 'cancelled';
  return (
    <li className="flex gap-3 px-4 py-3">
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-border',
          !interview.isUpcoming && 'opacity-60',
        )}
      >
        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          {day.month}
        </span>
        <span className="text-base font-semibold leading-none">{day.day}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium',
              cancelled && 'text-muted-foreground line-through',
            )}
          >
            {interview.title}
          </p>
          {!interview.isUpcoming && (
            <StatusPill tone={cancelled ? 'neutral' : 'success'}>
              {INTERVIEW_STATUS_LABEL[interview.status]}
            </StatusPill>
          )}
        </div>
        {interview.jobTitle && (
          <p className="text-xs text-muted-foreground">{interview.jobTitle}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {portalDateTime(interview.scheduledAt)} ·{' '}
            {formatDuration(interview.durationMinutes)}
          </span>
          <span>{INTERVIEW_TYPE_LABEL[interview.type]}</span>
          {interview.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {interview.location}
            </span>
          )}
        </div>
        {interview.isUpcoming && interview.meetingUrl && (
          <Button
            asChild
            size="sm"
            className="mt-1 h-8 text-white hover:opacity-90"
            style={{ backgroundColor: brand }}
          >
            <a
              href={interview.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Video className="h-3.5 w-3.5" />
              Join meeting
            </a>
          </Button>
        )}
      </div>
    </li>
  );
}

export function BookingLinkItem({ link }: { link: PortalBookingLink }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CalendarPlus className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          Book your {link.title.toLowerCase()}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            link.jobTitle,
            formatDuration(link.durationMinutes),
            `Book by ${portalDate(link.expiresAt)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={bookingHref(link.token)}>Pick a time</Link>
      </Button>
    </li>
  );
}

export function OfferItem({ offer }: { offer: PortalOffer }) {
  const status = OFFER_STATUS_META[offer.signStatus];
  const pay = offerPay(offer);
  return (
    <li>
      <Link
        href={offerHref(offer.id)}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
      >
        <FileSignature className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{offer.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[
              pay,
              offer.signStatus === 'pending' && offer.expiresAt
                ? `Respond by ${portalDate(offer.expiresAt)}`
                : offer.sentAt
                  ? `Sent ${portalDate(offer.sentAt)}`
                  : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}

export function DocumentRequestItem({
  request,
  action,
}: {
  request: PortalDocumentRequest;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <FileUp className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {DOCUMENT_TYPE_LABEL[request.type]} needed
        </p>
        <p className="truncate text-xs text-muted-foreground">
          For {request.jobTitles.join(', ')}
        </p>
      </div>
      {action}
    </li>
  );
}
