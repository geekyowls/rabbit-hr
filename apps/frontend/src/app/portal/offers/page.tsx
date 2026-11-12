'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileSignature } from 'lucide-react';
import { portalKeys, usePortalOffersQuery } from '@/hooks/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import { OfferSignView } from '@/components/offer-sign/offer-sign-view';
import {
  OfferItem,
  PortalCard,
  PortalList,
} from '@/components/portal/portal-items';

function OfferDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = usePortalOffersQuery();
  const offer = data?.find((o) => o.id === id);

  useEffect(
    () => () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.all });
    },
    [queryClient],
  );

  return (
    <div className="space-y-4">
      <Link
        href="/portal/offers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All offers
      </Link>
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : offer?.signToken ? (
        <OfferSignView token={offer.signToken} embedded />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            title="Offer not found"
            description="It may have been withdrawn. Contact the team if you have questions"
          />
        </div>
      )}
    </div>
  );
}

function OffersList() {
  const { data, isLoading } = usePortalOffersQuery();
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
        <p className="text-sm text-muted-foreground">
          Review, sign or decline the offers sent to you
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : data?.length ? (
        <PortalCard>
          <PortalList>
            {data.map((offer) => (
              <OfferItem key={offer.id} offer={offer} />
            ))}
          </PortalList>
        </PortalCard>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<FileSignature className="h-8 w-8" />}
            title="No offers yet"
            description="When you receive an offer, you can review and sign it here"
          />
        </div>
      )}
    </div>
  );
}

function OffersContent() {
  const id = useSearchParams().get('id');
  return id ? <OfferDetail id={id} /> : <OffersList />;
}

export default function PortalOffersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
      <OffersContent />
    </Suspense>
  );
}
