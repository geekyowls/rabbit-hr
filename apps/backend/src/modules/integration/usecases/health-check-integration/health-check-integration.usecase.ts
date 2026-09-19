import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationIntegrationRepository } from '@db/repositories';
import { OrganizationIntegrationStatus } from '@db/enums';
import { decryptIntegrationData } from '@boilerplate/core';
import { HealthCheckIntegrationCommand } from './health-check-integration.command';
import {
  runHealthCheck,
  isApiKeyProvider,
  type ApiKeyCredentials,
} from '../../adapters/api-key-providers';

@Injectable()
export class HealthCheckIntegration {
  constructor(
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: HealthCheckIntegrationCommand): Promise<{
    ok: boolean;
    status: OrganizationIntegrationStatus;
    errorMessage: string | null;
  }> {
    if (!isApiKeyProvider(command.provider)) {
      throw new BadRequestException(
        `Provider "${command.provider}" does not support health checks`,
      );
    }

    const orgIntegration =
      await this.organizationIntegrationRepository.findByOrganizationAndProvider(
        command.organizationId,
        command.provider,
      );

    if (!orgIntegration || !orgIntegration.encryptedTokens) {
      throw new NotFoundException(
        `Integration "${command.provider}" is not connected for this organization`,
      );
    }

    const encryptionKey = this.configService.get<string>(
      'INTEGRATION_ENCRYPTION_KEY',
    );

    if (!encryptionKey) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY is not configured.',
      );
    }

    const decrypted = decryptIntegrationData(
      orgIntegration.encryptedTokens,
      encryptionKey,
    );

    const credentials: ApiKeyCredentials = {
      apiKey: decrypted.apiKey,
      authId: decrypted.authId,
      authToken: decrypted.authToken,
    };

    const result = await runHealthCheck(command.provider, credentials);

    orgIntegration.status = result.ok
      ? OrganizationIntegrationStatus.CONNECTED
      : OrganizationIntegrationStatus.ERROR;
    orgIntegration.errorMessage = result.errorMessage ?? null;
    orgIntegration.lastSyncAt = new Date();
    if (result.accountIdentifier) {
      orgIntegration.accountName = result.accountIdentifier;
    }

    await this.organizationIntegrationRepository.save(orgIntegration);

    return {
      ok: result.ok,
      status: orgIntegration.status,
      errorMessage: result.errorMessage ?? null,
    };
  }
}
