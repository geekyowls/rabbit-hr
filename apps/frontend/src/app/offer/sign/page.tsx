'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OfferSignView } from '@/components/offer-sign/offer-sign-view';

function OfferSignContent() {
  const params = useSearchParams();
  return <OfferSignView token={params.get('token')?.trim() || null} />;
}

export default function OfferSignPage() {
  return (
    <Suspense fallback={null}>
      <OfferSignContent />
    </Suspense>
  );
}
