import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RedisCacheService } from '@boilerplate/core';
import { SupportedIntegrationRepository } from '@db/repositories';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';
import { planFeatureForIntegration } from '../../core/integration-capabilities.types';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import { GetAuthUrlCommand } from './get-auth-url.command';

@Injectable()
export class GetAuthUrl {
  constructor(
    private readonly supportedIntegrationRepository: SupportedIntegrationRepository,
    private readonly configService: ConfigService,
    private readonly cacheService: RedisCacheService,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async execute(command: GetAuthUrlCommand): Promise<{ authUrl: string }> {
    const integration =
      await this.supportedIntegrationRepository.findByProvider(
        command.provider,
      );

    if (!integration) {
      throw new BadRequestException(
        `Integration "${command.provider}" not found`,
      );
    }

    if (!integration.isActive) {
      throw new BadRequestException(
        `Integration "${command.provider}" is not active`,
      );
    }

    const planFeature = planFeatureForIntegration(integration);
    if (planFeature) {
      await this.entitlements.assertFeature(
        command.organizationId,
        planFeature,
      );
    }

    const authUrl = await this.buildAuthUrl(
      command.provider,
      command.organizationId,
      command.userId,
      integration.id,
    );

    return { authUrl };
  }

  private async buildAuthUrl(
    provider: string,
    organizationId: string,
    userId: string,
    integrationId: string,
  ): Promise<string> {
    const nonce = crypto.randomBytes(32).toString('hex');

    await this.cacheService.setString(
      CACHE_KEYS.oauthNonce(nonce),
      JSON.stringify({ organizationId, userId }),
      CACHE_TTL.OAUTH_NONCE,
    );

    const state = Buffer.from(
      JSON.stringify({
        organizationId,
        userId,
        integrationId,
        provider,
        timestamp: Date.now(),
        nonce,
      }),
    ).toString('base64');

    const redirectUri =
      this.configService.get<string>('OAUTH_REDIRECT_URI') ||
      `${this.configService.get<string>('API_URL')}/api/v1/integrations/callback`;

    switch (provider) {
      case 'google_calendar':
        return this.buildGoogleAuthUrl(state, redirectUri);
      case 'zoom':
        return this.buildZoomAuthUrl(state, redirectUri);
      case 'slack':
        return this.buildSlackAuthUrl(state, redirectUri);
      case 'microsoft_teams':
        return this.buildMicrosoftAuthUrl(state, redirectUri);
      case 'zoho_books':
        return this.buildZohoAuthUrl(state, redirectUri);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  private buildZohoAuthUrl(state: string, redirectUri: string): string {
    const clientId = this.configService.get<string>('ZOHO_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Zoho Books is not configured');
    }

    const accountsUrl =
      this.configService.get<string>('ZOHO_ACCOUNTS_URL') ||
      'https://accounts.zoho.com';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'ZohoBooks.fullaccess.all',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${accountsUrl}/oauth/v2/auth?${params.toString()}`;
  }

  private buildGoogleAuthUrl(state: string, redirectUri: string): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google Calendar is not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope:
        'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private buildZoomAuthUrl(state: string, redirectUri: string): string {
    const clientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Zoom is not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });

    return `https://zoom.us/oauth/authorize?${params.toString()}`;
  }

  private buildSlackAuthUrl(state: string, redirectUri: string): string {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Slack is not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'chat:write,channels:read,users:read',
      state,
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  private buildMicrosoftAuthUrl(state: string, redirectUri: string): string {
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Microsoft Teams is not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope:
        'offline_access User.Read Calendars.ReadWrite OnlineMeetings.ReadWrite',
      state,
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }
}
