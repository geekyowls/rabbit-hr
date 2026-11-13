import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SupportedIntegrationRepository,
  OrganizationIntegrationRepository,
} from '@db/repositories';
import { IntegrationAuthType, OrganizationIntegrationStatus } from '@db/enums';
import { isApiKeyProvider } from '../../adapters/api-key-providers';
import { ListIntegrationsCommand } from './list-integrations.command';
import { IntegrationListItemDto } from '../../dtos/integration-list-item.dto';
import { planFeatureForIntegration } from '../../core/integration-capabilities.types';

@Injectable()
export class ListIntegrations {
  constructor(
    private readonly supportedIntegrationRepository: SupportedIntegrationRepository,
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: ListIntegrationsCommand,
  ): Promise<IntegrationListItemDto[]> {
    const supportedIntegrations =
      await this.supportedIntegrationRepository.findAllActive();

    const orgIntegrations =
      await this.organizationIntegrationRepository.findByOrganizationId(
        command.organizationId,
      );

    const orgIntegrationMap = new Map(
      orgIntegrations.map((oi) => [oi.supportedIntegrationId, oi]),
    );

    return supportedIntegrations.map((si) => {
      const orgIntegration = orgIntegrationMap.get(si.id);
      const isConnected =
        orgIntegration?.status === OrganizationIntegrationStatus.CONNECTED;

      return {
        id: si.id,
        provider: si.provider,
        name: si.name,
        description: si.description,
        iconUrl: si.iconUrl,
        category: si.category,
        authType: si.authType,
        isConnected,
        isConfigured: this.isProviderConfigured(si),
        accountEmail: orgIntegration?.accountEmail ?? null,
        accountName: orgIntegration?.accountName ?? null,
        connectedAt: orgIntegration?.createdAt?.toISOString(),
        status: orgIntegration?.status,
        errorMessage: orgIntegration?.errorMessage ?? null,
        webhookToken: orgIntegration?.webhookToken ?? null,
        planFeature: planFeatureForIntegration(si),
      };
    });
  }

  private isProviderConfigured(integration: {
    provider: string;
    authType: IntegrationAuthType;
  }): boolean {
    if (
      integration.authType === IntegrationAuthType.API_KEY &&
      isApiKeyProvider(integration.provider)
    ) {
      return true;
    }
    return this.isOAuthProviderConfigured(integration.provider);
  }

  private isOAuthProviderConfigured(provider: string): boolean {
    switch (provider) {
      case 'google_calendar':
        return !!(
          this.configService.get('GOOGLE_CLIENT_ID') &&
          this.configService.get('GOOGLE_CLIENT_SECRET')
        );
      case 'zoom':
        return !!(
          this.configService.get('ZOOM_CLIENT_ID') &&
          this.configService.get('ZOOM_CLIENT_SECRET')
        );
      case 'slack':
        return !!(
          this.configService.get('SLACK_CLIENT_ID') &&
          this.configService.get('SLACK_CLIENT_SECRET')
        );
      case 'microsoft_teams':
        return !!(
          this.configService.get('MICROSOFT_CLIENT_ID') &&
          this.configService.get('MICROSOFT_CLIENT_SECRET')
        );
      case 'zoho_books':
        return !!(
          this.configService.get('ZOHO_CLIENT_ID') &&
          this.configService.get('ZOHO_CLIENT_SECRET')
        );
      default:
        return false;
    }
  }
}
