import * as Sentry from '@sentry/nestjs';

const dsn = process.env.GLITCHTIP_DSN || process.env.SENTRY_DSN;

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie'];

const UNTRACED_ROUTES = /\/health\b|\/metrics\b|\/api\/docs|\/favicon/;

const parsedSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE);
const tracesSampleRate = Number.isFinite(parsedSampleRate)
  ? parsedSampleRate
  : 0;

function scrubRequest<T extends Sentry.Event>(event: T): T {
  const request = event.request;
  if (!request) return event;

  if (request.headers) {
    for (const key of Object.keys(request.headers)) {
      if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
        request.headers[key] = '[Filtered]';
      }
    }
  }

  delete request.cookies;
  delete request.query_string;
  if (typeof request.url === 'string') {
    request.url = request.url.split('?')[0];
  }

  return event;
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_RELEASE || process.env.npm_package_version,
    tracesSampleRate,
    tracesSampler: (context) =>
      UNTRACED_ROUTES.test(context.name ?? '') ? 0 : tracesSampleRate,
    sendDefaultPii: false,
    ignoreErrors: ['ECONNRESET', 'Client network socket'],
    beforeSend: scrubRequest,
    beforeSendTransaction: (event) =>
      event.contexts?.trace?.op === 'http.server' ? scrubRequest(event) : null,
  });
}
