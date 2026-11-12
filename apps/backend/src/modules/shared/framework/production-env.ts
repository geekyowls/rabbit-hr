import { Logger } from '@nestjs/common';

type ProcessRole = 'api' | 'worker';

const JWT_SECRETS = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CANDIDATE_PORTAL_JWT_ACCESS_SECRET',
  'CANDIDATE_PORTAL_JWT_REFRESH_SECRET',
];

const REQUIRED_ENV: Record<ProcessRole, string[]> = {
  api: [
    'DB_URL',
    'REDIS_HOST',
    'FRONTEND_URL',
    'INTEGRATION_ENCRYPTION_KEY',
    ...JWT_SECRETS,
  ],
  worker: ['DB_URL', 'REDIS_HOST', 'INTEGRATION_ENCRYPTION_KEY'],
};

const MIN_SECRET_LENGTH = 32;
const ENCRYPTION_KEY_PATTERN = /^[0-9a-fA-F]{64}$/;

const isPlaceholder = (value: string) =>
  value.includes('change-me') || /^0+$/.test(value);

export function assertProductionEnv(role: ProcessRole): void {
  if (process.env.NODE_ENV !== 'production') return;

  const env = process.env;
  const required = REQUIRED_ENV[role];
  const problems: string[] = [];

  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    problems.push(`missing required variables: ${missing.join(', ')}`);
  }

  const weakSecrets = JWT_SECRETS.filter(
    (key) =>
      required.includes(key) && env[key] && env[key].length < MIN_SECRET_LENGTH,
  );
  if (weakSecrets.length > 0) {
    problems.push(
      `secrets shorter than ${MIN_SECRET_LENGTH} characters: ${weakSecrets.join(', ')}`,
    );
  }

  const encryptionKey = env.INTEGRATION_ENCRYPTION_KEY;
  if (encryptionKey && !ENCRYPTION_KEY_PATTERN.test(encryptionKey)) {
    problems.push(
      'INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (openssl rand -hex 32)',
    );
  }

  if (env.DEV_BYPASS_PERMISSIONS === 'true') {
    problems.push('DEV_BYPASS_PERMISSIONS must not be true in production');
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid production configuration for the ${role}:\n- ${problems.join('\n- ')}`,
    );
  }

  const placeholders = required.filter((key) => isPlaceholder(env[key] ?? ''));
  if (placeholders.length > 0) {
    new Logger('ProductionEnv').warn(
      `Placeholder values in use, replace them before going live: ${placeholders.join(', ')}`,
    );
  }
}
