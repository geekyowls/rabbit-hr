'use client';

import { useEffect, useState } from 'react';
import { BellRing, BellOff, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getPushSubscription,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/web-push';
import { toast } from '@/lib/toast';

export function WebPushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    getPushSubscription()
      .then((sub) => setEnabled(!!sub))
      .catch(() => setEnabled(false));
  }, []);

  if (!supported) return null;

  const blocked = getNotificationPermission() === 'denied';

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setEnabled(false);
        toast.success('Push notifications turned off for this device');
      } else {
        const ok = await subscribeToPush();
        if (ok) {
          setEnabled(true);
          toast.success('Push notifications enabled for this device');
        } else {
          toast.error(
            blocked
              ? 'Notifications are blocked in your browser settings'
              : 'Could not enable push notifications',
          );
        }
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={toggle}
        disabled={busy || blocked}
        className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : enabled ? (
          <BellOff className="h-3.5 w-3.5" />
        ) : (
          <BellRing className="h-3.5 w-3.5" />
        )}
        {blocked
          ? 'Push blocked in browser settings'
          : enabled
            ? 'Turn off push on this device'
            : 'Enable push on this device'}
      </button>
      {enabled && (
        <p className="px-4 pb-2.5 text-center text-[10px] leading-snug text-zinc-400 dark:text-zinc-500">
          Not seeing notifications? Make sure notifications for your browser are
          turned on in your device system settings.
        </p>
      )}
    </div>
  );
}
