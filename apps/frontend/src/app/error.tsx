'use client';

import ErrorBoundary from '@/components/error-boundary';

export default function RootError({
  error,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  return <ErrorBoundary error={error} />;
}
