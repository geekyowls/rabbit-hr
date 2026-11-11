import { ConfigService } from '@nestjs/config';
import { decryptIntegrationData } from '@boilerplate/core';
import { OrganizationIntegrationRepository } from '@db/repositories';
import { OrganizationIntegrationStatus } from '@db/enums';

export async function findConnectedCredentials<T extends object>(
  integrations: OrganizationIntegrationRepository,
  config: ConfigService,
  organizationId: string,
  provider: string,
): Promise<T | null> {
  const integration = await integrations.findByOrganizationAndProvider(
    organizationId,
    provider,
  );
  if (
    integration?.status !== OrganizationIntegrationStatus.CONNECTED ||
    !integration.encryptedTokens
  ) {
    return null;
  }
  const key = config.get<string>('INTEGRATION_ENCRYPTION_KEY');
  if (!key) return null;
  try {
    return decryptIntegrationData(integration.encryptedTokens, key) as T;
  } catch {
    return null;
  }
}

export function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  return `+${cleaned}`;
}
