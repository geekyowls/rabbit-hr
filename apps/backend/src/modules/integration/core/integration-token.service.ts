import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import {
  CalendarIntegrationService,
  decryptIntegrationData,
  encryptIntegrationData,
  GoogleCalendarService,
  MicrosoftGraphService,
  OAuthTokens,
  ZoomService,
} from '@boilerplate/core';
import { OrganizationIntegrationEntity } from '@db/entities';
import { OrganizationIntegrationRepository } from '@db/repositories';
import { OrganizationIntegrationStatus } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { IntegrationCapabilitiesService } from './integration-capabilities.service';
import {
  INTEGRATION_PROVIDERS,
  IntegrationNotConnectedException,
  PROVIDER_LABELS,
} from './integration-capabilities.types';

const REFRESH_WINDOW_MS = 5 * 60 * 1000;
const EXPIRED_HINTS = [
  'invalid_grant',
  'invalid_token',
  'unauthorized',
  '401',
  'reconnect',
];

export interface ValidIntegrationTokens extends OAuthTokens {
  provider: string;
  accountEmail: string | null;
}

const NO_EXPIRY = new Date(8_640_000_000_000_000);

interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  [key: string]: unknown;
}

@Injectable()
export class IntegrationTokenService {
  private readonly logger = new ContextLogger(IntegrationTokenService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly configService: ConfigService,
    private readonly capabilities: IntegrationCapabilitiesService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly zoomService: ZoomService,
    private readonly microsoftGraphService: MicrosoftGraphService,
  ) {}

  calendarService(provider: string): CalendarIntegrationService {
    switch (provider) {
      case INTEGRATION_PROVIDERS.GOOGLE_CALENDAR:
        return this.googleCalendarService;
      case INTEGRATION_PROVIDERS.ZOOM:
        return this.zoomService;
      case INTEGRATION_PROVIDERS.MICROSOFT:
        return this.microsoftGraphService;
      default:
        throw new Error(`No calendar service for provider ${provider}`);
    }
  }

  async getValidTokens(
    organizationId: string,
    provider: string,
  ): Promise<ValidIntegrationTokens> {
    const integration =
      await this.organizationIntegrationRepository.findByOrganizationAndProvider(
        organizationId,
        provider,
      );
    this.assertConnected(integration, provider);
    if (!this.needsRefresh(integration!)) {
      return this.toTokens(integration!, provider);
    }
    return this.refresh(integration!.id, provider);
  }

  private assertConnected(
    integration: OrganizationIntegrationEntity | null,
    provider: string,
  ): void {
    if (
      integration?.status !== OrganizationIntegrationStatus.CONNECTED ||
      !integration.encryptedTokens
    ) {
      throw new IntegrationNotConnectedException(
        PROVIDER_LABELS[provider] ?? provider,
      );
    }
  }

  private needsRefresh(integration: OrganizationIntegrationEntity): boolean {
    if (!integration.tokenExpiresAt) return false;
    return (
      new Date(integration.tokenExpiresAt).getTime() - Date.now() <
      REFRESH_WINDOW_MS
    );
  }

  private encryptionKey(): string {
    const key = this.configService.get<string>('INTEGRATION_ENCRYPTION_KEY');
    if (!key) {
      throw new Error('INTEGRATION_ENCRYPTION_KEY is not configured');
    }
    return key;
  }

  private decrypt(integration: OrganizationIntegrationEntity): StoredTokens {
    return decryptIntegrationData(
      integration.encryptedTokens,
      this.encryptionKey(),
    ) as StoredTokens;
  }

  private toTokens(
    integration: OrganizationIntegrationEntity,
    provider: string,
  ): ValidIntegrationTokens {
    const stored = this.decrypt(integration);
    if (!stored.accessToken) {
      throw new Error(`Stored ${provider} credentials have no access token`);
    }
    return {
      provider,
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken ?? '',
      expiresAt: integration.tokenExpiresAt
        ? new Date(integration.tokenExpiresAt)
        : NO_EXPIRY,
      accountEmail: integration.accountEmail,
    };
  }

  private async refresh(
    integrationId: string,
    provider: string,
  ): Promise<ValidIntegrationTokens> {
    let failure: { organizationId: string; error: Error } | null = null;
    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrganizationIntegrationEntity);
      const locked = await repo.findOne({
        where: { id: integrationId },
        lock: { mode: 'pessimistic_write' },
      });
      this.assertConnected(locked, provider);
      if (!this.needsRefresh(locked!)) {
        return this.toTokens(locked!, provider);
      }
      const stored = this.decrypt(locked!);
      if (!stored.refreshToken) {
        failure = {
          organizationId: locked!.organizationId,
          error: new Error('No refresh token stored, reconnect required'),
        };
        await this.markFailed(repo, locked!, failure.error);
        return null;
      }
      try {
        const refreshed = await this.calendarService(provider).refreshTokens(
          stored.refreshToken,
        );
        locked!.encryptedTokens = encryptIntegrationData(
          {
            ...stored,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken || stored.refreshToken,
            expiresIn: Math.round(
              (refreshed.expiresAt.getTime() - Date.now()) / 1000,
            ),
          },
          this.encryptionKey(),
        );
        locked!.tokenExpiresAt = refreshed.expiresAt;
        locked!.errorMessage = null;
        locked!.lastSyncAt = new Date();
        await repo.save(locked!);
        return {
          provider,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken || stored.refreshToken,
          expiresAt: refreshed.expiresAt,
          accountEmail: locked!.accountEmail,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        failure = { organizationId: locked!.organizationId, error: err };
        await this.markFailed(repo, locked!, err);
        return null;
      }
    });
    if (!result) {
      const { organizationId, error } = failure as unknown as {
        organizationId: string;
        error: Error;
      };
      await this.capabilities.invalidate(organizationId);
      this.logger.warn(
        `Token refresh failed for ${provider}: ${error.message}`,
      );
      throw error;
    }
    return result;
  }

  private async markFailed(
    repo: Repository<OrganizationIntegrationEntity>,
    integration: OrganizationIntegrationEntity,
    error: Error,
  ): Promise<void> {
    const message = error.message.toLowerCase();
    integration.status = EXPIRED_HINTS.some((hint) => message.includes(hint))
      ? OrganizationIntegrationStatus.EXPIRED
      : OrganizationIntegrationStatus.ERROR;
    integration.errorMessage = error.message.slice(0, 1000);
    await repo.save(integration);
  }
}
