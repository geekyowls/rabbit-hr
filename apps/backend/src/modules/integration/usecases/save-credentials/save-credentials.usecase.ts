import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SupportedIntegrationRepository,
  OrganizationIntegrationRepository,
} from '@db/repositories';
import { IntegrationAuthType, OrganizationIntegrationStatus } from '@db/enums';
import {
  encryptIntegrationData,
  decryptIntegrationData,
} from '@boilerplate/core';
import { SaveCredentialsCommand } from './save-credentials.command';
import {
  validateCredentials,
  runHealthCheck,
  isApiKeyProvider,
  type ApiKeyCredentials,
} from '../../adapters/api-key-providers';

const nonEmpty = (value?: string): string | undefined =>
  value && value.trim() !== '' ? value.trim() : undefined;

@Injectable()
export class SaveCredentials {
  constructor(
    private readonly supportedIntegrationRepository: SupportedIntegrationRepository,
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: SaveCredentialsCommand): Promise<{
    status: OrganizationIntegrationStatus;
    errorMessage: string | null;
    webhookToken: string | null;
  }> {
    if (!isApiKeyProvider(command.provider)) {
      throw new BadRequestException(
        `Provider "${command.provider}" does not support API key authentication`,
      );
    }

    const integration = await this.supportedIntegrationRepository.findOne({
      where: { provider: command.provider },
    });

    if (!integration) {
      throw new NotFoundException(
        `Integration "${command.provider}" not found`,
      );
    }

    if (integration.authType !== IntegrationAuthType.API_KEY) {
      throw new BadRequestException(
        `Integration "${command.provider}" does not support API key authentication`,
      );
    }

    const encryptionKey = this.configService.get<string>(
      'INTEGRATION_ENCRYPTION_KEY',
    );

    if (!encryptionKey) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY is not configured. Cannot store credentials securely.',
      );
    }

    let orgIntegration =
      await this.organizationIntegrationRepository.findByOrganizationAndIntegration(
        command.organizationId,
        integration.id,
      );

    let existingCredentials: ApiKeyCredentials = {};
    if (orgIntegration?.encryptedTokens) {
      try {
        existingCredentials = decryptIntegrationData(
          orgIntegration.encryptedTokens,
          encryptionKey,
        ) as ApiKeyCredentials;
      } catch {
        throw new BadRequestException(
          'Failed to read stored credentials. They may have been encrypted with a different key.',
        );
      }
    }

    const credentials: ApiKeyCredentials = {
      apiKey: nonEmpty(command.apiKey) ?? existingCredentials.apiKey,
      authId: nonEmpty(command.authId) ?? existingCredentials.authId,
      authToken: nonEmpty(command.authToken) ?? existingCredentials.authToken,
      phoneNumber:
        nonEmpty(command.phoneNumber) ?? existingCredentials.phoneNumber,
      webhookSecret:
        nonEmpty(command.webhookSecret) ?? existingCredentials.webhookSecret,
    };

    validateCredentials(command.provider, credentials);

    const healthCheck = await runHealthCheck(command.provider, credentials);

    const status = healthCheck.ok
      ? OrganizationIntegrationStatus.CONNECTED
      : OrganizationIntegrationStatus.ERROR;

    const encryptedTokens = encryptIntegrationData(credentials, encryptionKey);

    const webhookToken = orgIntegration?.webhookToken ?? null;

    if (orgIntegration) {
      orgIntegration.encryptedTokens = encryptedTokens;
      orgIntegration.tokenExpiresAt = null;
      orgIntegration.status = status;
      orgIntegration.connectedBy = command.userId;
      orgIntegration.accountName = healthCheck.accountIdentifier ?? null;
      orgIntegration.errorMessage = healthCheck.errorMessage ?? null;
      orgIntegration.lastSyncAt = new Date();
      orgIntegration.webhookToken = webhookToken;
    } else {
      orgIntegration = this.organizationIntegrationRepository.create({
        organizationId: command.organizationId,
        supportedIntegrationId: integration.id,
        encryptedTokens,
        tokenExpiresAt: null,
        status,
        connectedBy: command.userId,
        accountName: healthCheck.accountIdentifier ?? null,
        errorMessage: healthCheck.errorMessage ?? null,
        lastSyncAt: new Date(),
        webhookToken,
      });
    }

    await this.organizationIntegrationRepository.save(orgIntegration);

    return {
      status,
      errorMessage: healthCheck.errorMessage ?? null,
      webhookToken,
    };
  }
}
