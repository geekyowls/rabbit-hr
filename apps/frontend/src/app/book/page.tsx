'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalendarClock,
  CalendarX2,
  Clock,
  Hourglass,
  LinkIcon,
  MapPin,
} from 'lucide-react';
import { ApiError } from '@/utils/error-class';
import { usePublicBookingQuery } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookingNotice,
  BookingShell,
} from '@/components/booking/booking-shell';
import { SlotPicker } from '@/components/booking/slot-picker';
import { BookingConfirmed } from '@/components/booking/booking-confirmed';
import { browserTimezone } from '@/components/booking/booking-utils';
import {
  INTERVIEW_TYPE_LABEL,
  formatDuration,
} from '@/components/interviews/interview-data';
import type { PublicBookingLink } from '@/types/booking-link.type';

function LinkSummary({ link }: { link: PublicBookingLink }) {
  return (
    <div className="space-y-2 border-b border-border pb-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {link.jobTitle}
      </p>
      <h1 className="text-xl font-semibold">{link.title}</h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4" />
          {INTERVIEW_TYPE_LABEL[link.type]}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {formatDuration(link.durationMinutes)}
        </span>
        {link.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {link.location}
          </span>
        )}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <BookingShell loading>
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </BookingShell>
  );
}

function BookingContent() {
  const params = useSearchParams();
  const token = params.get('token')?.trim() || null;
  const wantsCancel = params.get('action') === 'cancel';
  const {
    data: link,
    isLoading,
    error,
    refetch,
  } = usePublicBookingQuery(token);
  const [timezone, setTimezone] = useState<string | null>(null);

  if (!token) {
    return (
      <BookingShell>
        <BookingNotice
          icon={<LinkIcon className="h-10 w-10" />}
          title="This booking link is not valid"
          description="Check the link in your email or ask the recruiter for a new one"
        />
      </BookingShell>
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (error || !link) {
    const notFound = error instanceof ApiError && error.statusCode === 404;
    return (
      <BookingShell>
        <BookingNotice
          icon={<LinkIcon className="h-10 w-10" />}
          title={
            notFound
              ? 'This booking link is not valid'
              : 'Could not load this booking link'
          }
          description={
            notFound
              ? 'Check the link in your email or ask the recruiter for a new one'
              : 'Check your connection and try again'
          }
          action={
            notFound ? undefined : (
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            )
          }
        />
      </BookingShell>
    );
  }

  const zone = timezone ?? browserTimezone(link.timezone);
  const booking = link.booking;
  const bookingCancelled = booking?.status === 'cancelled';

  let body: React.ReactNode;
  if (link.status === 'cancelled' || bookingCancelled) {
    body = (
      <BookingNotice
        icon={<CalendarX2 className="h-10 w-10" />}
        title="This interview has been cancelled"
        description="Contact the recruiter if you would like to arrange another time"
      />
    );
  } else if (link.status === 'expired') {
    body = (
      <BookingNotice
        icon={<Hourglass className="h-10 w-10" />}
        title="This booking link has expired"
        description="Ask the recruiter to send you a new link"
      />
    );
  } else if (link.status === 'booked' && booking) {
    body = (
      <BookingConfirmed
        token={token}
        link={link}
        booking={booking}
        timezone={zone}
        cancelOpenInitially={wantsCancel}
      />
    );
  } else if (link.status === 'booked') {
    body = (
      <BookingNotice
        title="This interview is already booked"
        description="Check your email for the confirmation"
      />
    );
  } else {
    body = (
      <SlotPicker
        token={token}
        link={link}
        timezone={zone}
        onTimezoneChange={setTimezone}
      />
    );
  }

  return (
    <BookingShell companyName={link.companyName} companyLogo={link.companyLogo}>
      <div className="space-y-5 rounded-xl border border-border bg-card p-5">
        <LinkSummary link={link} />
        {body}
      </div>
    </BookingShell>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BookingContent />
    </Suspense>
  );
}
