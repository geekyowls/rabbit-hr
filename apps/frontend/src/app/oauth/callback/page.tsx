'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    const callbackData = {
      type: 'oauth-callback',
      success: success === 'true',
      provider,
      error,
    };

    if (window.opener) {
      window.opener.postMessage(callbackData, window.location.origin);
      window.close();
      return;
    }

    localStorage.setItem('oauth-callback', JSON.stringify(callbackData));

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'oauth-callback',
        newValue: JSON.stringify(callbackData),
      }),
    );

    setTimeout(() => {
      window.close();
    }, 100);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Processing connection...</p>
        <p className="text-sm text-muted-foreground">
          This window will close automatically.
        </p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
