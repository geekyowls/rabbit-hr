import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  return navigator.serviceWorker.register('/sw.js');
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const registration = await registerServiceWorker();
  if (!registration) return false;
  await navigator.serviceWorker.ready;

  const { publicKey, enabled } = await fetchApi<{
    publicKey: string;
    enabled: boolean;
  }>(API_ROUTES.NOTIFICATION_FEED.WEB_PUSH_PUBLIC_KEY);
  if (!enabled || !publicKey) return false;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = subscription.toJSON();
  await fetchApi(API_ROUTES.NOTIFICATION_FEED.WEB_PUSH_SUBSCRIBE, {
    method: 'POST',
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getPushSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await fetchApi(API_ROUTES.NOTIFICATION_FEED.WEB_PUSH_UNSUBSCRIBE, {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
}
