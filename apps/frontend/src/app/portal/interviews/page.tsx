'use client';

import { CalendarClock } from 'lucide-react';
import { usePortalInterviewsQuery } from '@/hooks/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import { usePortalSession } from '@/components/portal/portal-session';
import {
  BookingLinkItem,
  InterviewItem,
  PortalCard,
  PortalEmpty,
  PortalList,
} from '@/components/portal/portal-items';

export default function PortalInterviewsPage() {
  const { brand } = usePortalSession();
  const { data, isLoading } = usePortalInterviewsQuery();
  const empty =
    data &&
    !data.upcoming.length &&
    !data.past.length &&
    !data.bookingLinks.length;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Interviews</h1>
        <p className="text-sm text-muted-foreground">
          Times are shown in your local time zone
        </p>
      </div>
      {isLoading || !data ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : empty ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarClock className="h-8 w-8" />}
            title="No interviews yet"
            description="When the team invites you to interview, it will show here"
          />
        </div>
      ) : (
        <>
          {data.bookingLinks.length > 0 && (
            <PortalCard title="Choose a time">
              <PortalList>
                {data.bookingLinks.map((link) => (
                  <BookingLinkItem key={link.id} link={link} />
                ))}
              </PortalList>
            </PortalCard>
          )}
          <PortalCard title="Upcoming">
            {data.upcoming.length ? (
              <PortalList>
                {data.upcoming.map((interview) => (
                  <InterviewItem
                    key={interview.id}
                    interview={interview}
                    brand={brand}
                  />
                ))}
              </PortalList>
            ) : (
              <PortalEmpty>No upcoming interviews</PortalEmpty>
            )}
          </PortalCard>
          {data.past.length > 0 && (
            <PortalCard title="Past">
              <PortalList>
                {data.past.map((interview) => (
                  <InterviewItem
                    key={interview.id}
                    interview={interview}
                    brand={brand}
                  />
                ))}
              </PortalList>
            </PortalCard>
          )}
        </>
      )}
    </div>
  );
}
