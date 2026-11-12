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
import { OrganizationIntegrationStatus } from '@db/enums';
import {
  encryptIntegrationData,
  decryptIntegrationData,
  generateSecureToken,
} from '@boilerplate/core';
import { EnsureRazorpayWebhookTokenCommand } from './ensure-razorpay-webhook-token.command';
import type { ApiKeyCredentials } from '../../adapters/api-key-providers';

const RAZORPAY_PROVIDER = 'razorpay';

@Injectable()
export class EnsureRazorpayWebhookToken {
  constructor(
    private readonly supportedIntegrationRepository: SupportedIntegrationRepository,
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: EnsureRazorpayWebhookTokenCommand,
  ): Promise<{ webhookToken: string; webhookSecret: string }> {
    const integration = await this.supportedIntegrationRepository.findOne({
      where: { provider: RAZORPAY_PROVIDER },
    });

    if (!integration) {
      throw new NotFoundException('Razorpay integration is not available');
    }

    const encryptionKey = this.configService.get<string>(
      'INTEGRATION_ENCRYPTION_KEY',
    );

    if (!encryptionKey) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY is not configured.',
      );
    }

    let orgIntegration =
      await this.organizationIntegrationRepository.findByOrganizationAndIntegration(
        command.organizationId,
        integration.id,
      );

    let credentials: ApiKeyCredentials = {};
    if (orgIntegration?.encryptedTokens) {
      try {
        credentials = decryptIntegrationData(
          orgIntegration.encryptedTokens,
          encryptionKey,
        ) as ApiKeyCredentials;
      } catch {
        throw new BadRequestException(
          'Failed to read stored credentials. They may have been encrypted with a different key.',
        );
      }
    }

    let changed = false;

    let webhookToken = orgIntegration?.webhookToken ?? null;
    if (!webhookToken) {
      webhookToken = generateSecureToken('whk', 16);
      changed = true;
    }

    if (!credentials.webhookSecret) {
      credentials.webhookSecret = generateSecureToken('whsec', 24);
      changed = true;
    }

    if (orgIntegration) {
      if (changed) {
        orgIntegration.webhookToken = webhookToken;
        orgIntegration.encryptedTokens = encryptIntegrationData(
          credentials,
          encryptionKey,
        );
        await this.organizationIntegrationRepository.save(orgIntegration);
      }
    } else {
      orgIntegration = this.organizationIntegrationRepository.create({
        organizationId: command.organizationId,
        supportedIntegrationId: integration.id,
        encryptedTokens: encryptIntegrationData(credentials, encryptionKey),
        status: OrganizationIntegrationStatus.DISCONNECTED,
        connectedBy: command.userId,
        webhookToken,
      });
      await this.organizationIntegrationRepository.save(orgIntegration);
    }

    return { webhookToken, webhookSecret: credentials.webhookSecret };
  }
}
