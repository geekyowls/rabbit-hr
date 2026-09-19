'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/system/organizations');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
    </div>
  );
}
