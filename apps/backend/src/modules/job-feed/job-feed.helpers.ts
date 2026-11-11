import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JobFeedEntity } from '@db/entities';

export type JobFeedFormat = 'indeed' | 'linkedin';

export function generateFeedToken(): string {
  return randomBytes(24).toString('hex');
}

export function frontendUrl(config: ConfigService): string {
  return (
    config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
  ).replace(/\/+$/, '');
}

export function feedUrls(config: ConfigService, feed: JobFeedEntity | null) {
  if (!feed) return null;
  const base = `${(config.get<string>('API_URL') || '').replace(/\/+$/, '')}/api/v1/public/job-feed/${feed.token}`;
  return { indeed: `${base}.xml`, linkedin: `${base}/linkedin.xml` };
}

export function toSettingsResponse(
  config: ConfigService,
  feed: JobFeedEntity | null,
) {
  return {
    enabled: feed?.enabled ?? false,
    includeClientNames: feed?.includeClientNames ?? true,
    lastAccessedAt: feed?.lastAccessedAt ?? null,
    updatedAt: feed?.updatedAt ?? null,
    feedUrls: feedUrls(config, feed),
  };
}
