'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/session-context';
import { captureError } from '@/lib/glitchtip';
import { isChunkLoadError, recoverFromChunkError } from '@/lib/chunk-reload';

export default function ErrorBoundary({ error }: { error: Error }) {
  const router = useRouter();
  const { logout } = useSession();
  const [countdown, setCountdown] = useState(10);
  const isChunkError = isChunkLoadError(error);

  useEffect(() => {
    if (isChunkError) {
      recoverFromChunkError();
      return;
    }
    captureError(error);
  }, [error, isChunkError]);
  const isUnauthorized =
    error.message?.includes('401') || error.message?.includes('Unauthorized');

  useEffect(() => {
    if (!isUnauthorized) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnauthorized]);

  useEffect(() => {
    if (!isUnauthorized || countdown > 0) return;
    logout();
  }, [countdown, isUnauthorized, logout]);

  if (isChunkError) {
    return (
      <div className="flex items-center justify-center min-h-[90vh]">
        <div className="w-full max-w-md p-8 mx-4 bg-white dark:bg-background border border-border rounded-xl dark:shadow-lg dark:shadow-gray-900/30">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">
              Updating RabbitHR
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              A new version is available. Refreshing to get the latest updates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isUnauthorized) {
    return (
      <div className="flex items-center justify-center min-h-[90vh]">
        <div className="w-full max-w-md p-8 mx-4 bg-white dark:bg-background border border-border rounded-xl dark:shadow-lg dark:shadow-gray-900/30">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              An error occurred while processing your request. Please try again
              or refresh the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh]">
      <div className="w-full max-w-md p-8 mx-4 bg-white dark:bg-background border border-border rounded-xl dark:shadow-lg dark:shadow-gray-900/30">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-500">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Your session has expired. You will be logged out in {countdown}{' '}
            seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
