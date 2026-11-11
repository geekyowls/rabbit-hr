import { ConfigService } from '@nestjs/config';
import { INBOX_FRONTEND_PATH } from '../mailbox.constants';

const ALLOWED_REDIRECT_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'rabbithr.co',
  'app.rabbithr.co',
];

function resolveFrontendUrl(configService: ConfigService): string {
  const fallback = 'http://localhost:3000';
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (!frontendUrl) return fallback;
  try {
    const hostname = new URL(frontendUrl).hostname.toLowerCase();
    const allowed = ALLOWED_REDIRECT_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
    return allowed ? frontendUrl.replace(/\/$/, '') : fallback;
  } catch {
    return fallback;
  }
}

export function inboxRedirectUrl(
  configService: ConfigService,
  params: Record<string, string>,
): string {
  const query = new URLSearchParams(params).toString();
  return `${resolveFrontendUrl(configService)}${INBOX_FRONTEND_PATH}?${query}`;
}
