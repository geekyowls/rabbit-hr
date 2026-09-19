import * as Sentry from '@sentry/browser';

let initialized = false;

export function initGlitchtip() {
  if (initialized || typeof window === 'undefined') return;
  const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;
  if (!dsn || process.env.NODE_ENV === 'development') return;

  initialized = true;
  Sentry.init({
    dsn,
    release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
    environment: process.env.NEXT_PUBLIC_GLITCHTIP_ENV || 'production',
    tracesSampleRate: 0,
    sendDefaultPii: false,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications.',
    ],
    beforeSend(event) {
      const headers = event.request?.headers as
        | Record<string, string>
        | undefined;
      if (headers) {
        delete headers.Authorization;
        delete headers.authorization;
      }
      const message = event.exception?.values?.[0]?.value ?? '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        return null;
      }
      return event;
    },
  });
}

export function setGlitchtipUser(user: {
  id: string;
  email?: string;
  organizationId?: string;
}) {
  if (!initialized) return;
  Sentry.setUser({ id: user.id, email: user.email });
  Sentry.setTag('organizationId', user.organizationId ?? 'unknown');
}

export function clearGlitchtipUser() {
  if (!initialized) return;
  Sentry.setUser(null);
  Sentry.setTag('organizationId', undefined);
}

export function captureError(error: unknown) {
  if (!initialized) return;
  Sentry.captureException(error);
}
