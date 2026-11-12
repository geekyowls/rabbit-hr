'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { usePortalOverviewQuery } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortalSession } from '@/components/portal/portal-session';
import {
  ApplicationItem,
  BookingLinkItem,
  DocumentRequestItem,
  InterviewItem,
  OfferItem,
  PortalCard,
  PortalEmpty,
  PortalList,
} from '@/components/portal/portal-items';
import { greeting } from '@/components/portal/portal-utils';

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      View all
    </Link>
  );
}

export default function PortalHomePage() {
  const { me, brand } = usePortalSession();
  const { data, isLoading } = usePortalOverviewQuery();
  const welcome = me.organization.welcomeMessage;
  const pendingOffers = data?.pendingOffers ?? [];
  const requests = data?.documentRequests ?? [];
  const bookingLinks = data?.bookingLinks ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {me.candidate.firstName}
        </h1>
        {welcome && (
          <p className="max-w-2xl text-sm text-muted-foreground">{welcome}</p>
        )}
      </div>

      {isLoading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {(pendingOffers.length > 0 ||
            requests.length > 0 ||
            bookingLinks.length > 0) && (
            <PortalCard title="Needs your attention">
              <PortalList>
                {pendingOffers.map((offer) => (
                  <OfferItem key={offer.id} offer={offer} />
                ))}
                {bookingLinks.map((link) => (
                  <BookingLinkItem key={link.id} link={link} />
                ))}
                {requests.map((request) => (
                  <DocumentRequestItem
                    key={request.type}
                    request={request}
                    action={
                      <Button asChild size="sm" variant="outline">
                        <Link href="/portal/documents">Upload</Link>
                      </Button>
                    }
                  />
                ))}
              </PortalList>
            </PortalCard>
          )}

          <PortalCard
            title="Upcoming interviews"
            action={<ViewAll href="/portal/interviews" />}
          >
            {data.upcomingInterviews.length ? (
              <PortalList>
                {data.upcomingInterviews.map((interview) => (
                  <InterviewItem
                    key={interview.id}
                    interview={interview}
                    brand={brand}
                  />
                ))}
              </PortalList>
            ) : (
              <PortalEmpty>No interviews scheduled</PortalEmpty>
            )}
          </PortalCard>

          <PortalCard
            title="My applications"
            action={<ViewAll href="/portal/applications" />}
          >
            {data.applications.length ? (
              <PortalList>
                {data.applications.slice(0, 5).map((application) => (
                  <ApplicationItem
                    key={application.id}
                    application={application}
                  />
                ))}
              </PortalList>
            ) : (
              <PortalEmpty>You have not applied for any roles yet</PortalEmpty>
            )}
          </PortalCard>

          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Looking for your next role
                </p>
                <p className="text-xs text-muted-foreground">
                  Browse open roles at {me.organization.name} and apply in a few
                  clicks
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/portal/jobs">Browse roles</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
