'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  BILLING_ERROR_CODES,
  type BillingErrorCode,
} from '@boilerplate/shared';
import { ApiError } from '@/utils/error-class';
import { BILLING_SETTINGS_PATH } from './billing-links';

const UPGRADE_CODES: BillingErrorCode[] = [
  BILLING_ERROR_CODES.PLAN_UPGRADE_REQUIRED,
  BILLING_ERROR_CODES.MEMBER_LIMIT_REACHED,
  BILLING_ERROR_CODES.ACTIVE_JOB_LIMIT_REACHED,
];

export function isUpgradeError(err: unknown): err is ApiError {
  const code = (err as ApiError | undefined)?.data?.code as
    BillingErrorCode | undefined;
  return err instanceof ApiError && !!code && UPGRADE_CODES.includes(code);
}

export function apiErrorDescription(
  err: unknown,
  fallback = 'Something went wrong',
): ReactNode {
  const message = err instanceof Error ? err.message : fallback;
  if (!isUpgradeError(err)) return message;
  return (
    <span>
      {message}{' '}
      <Link
        href={BILLING_SETTINGS_PATH}
        className="font-medium underline underline-offset-4"
      >
        See plans
      </Link>
    </span>
  );
}
