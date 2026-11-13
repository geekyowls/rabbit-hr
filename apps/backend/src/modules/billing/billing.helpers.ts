import { ConfigService } from '@nestjs/config';
import { buildUrl } from '@boilerplate/core';

export const BILLING_PAGE_PATH = '/dashboard/settings/billing';

export function billingReturnUrl(config: ConfigService): string {
  return (
    config.get<string>('DODO_CHECKOUT_RETURN_URL') ||
    buildUrl(config.get<string>('FRONTEND_BASE_URL'), BILLING_PAGE_PATH)
  );
}
