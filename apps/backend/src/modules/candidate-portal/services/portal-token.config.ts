import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

export const PORTAL_TOKEN_AUDIENCE = 'candidate-portal';
export const PORTAL_ACCESS_TOKEN_TYPE = 'candidate_access';
export const PORTAL_REFRESH_TOKEN_TYPE = 'candidate_refresh';

type PortalTokenKind = 'access' | 'refresh';

const SECRET_ENV: Record<PortalTokenKind, string> = {
  access: 'CANDIDATE_PORTAL_JWT_ACCESS_SECRET',
  refresh: 'CANDIDATE_PORTAL_JWT_REFRESH_SECRET',
};

const BASE_SECRET_ENV: Record<PortalTokenKind, string> = {
  access: 'JWT_ACCESS_SECRET',
  refresh: 'JWT_REFRESH_SECRET',
};

const EXPIRES_ENV: Record<PortalTokenKind, string> = {
  access: 'CANDIDATE_PORTAL_JWT_ACCESS_EXPIRES_IN',
  refresh: 'CANDIDATE_PORTAL_JWT_REFRESH_EXPIRES_IN',
};

const DEFAULT_EXPIRES: Record<PortalTokenKind, string> = {
  access: '1h',
  refresh: '30d',
};

export function portalTokenSecret(
  config: ConfigService,
  kind: PortalTokenKind,
): string {
  const explicit = config.get<string>(SECRET_ENV[kind]);
  if (explicit) return explicit;
  const base = config.get<string>(BASE_SECRET_ENV[kind]);
  if (config.get<string>('NODE_ENV') === 'production' || !base) {
    throw new Error(`${SECRET_ENV[kind]} is not defined`);
  }
  return createHmac('sha256', base)
    .update(`rabbithr-candidate-portal-${kind}`)
    .digest('hex');
}

export function portalTokenExpiresIn(
  config: ConfigService,
  kind: PortalTokenKind,
): JwtSignOptions['expiresIn'] {
  return (config.get<string>(EXPIRES_ENV[kind]) ||
    DEFAULT_EXPIRES[kind]) as JwtSignOptions['expiresIn'];
}
