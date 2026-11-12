import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import { ExcludeFromIdempotency } from '@shared/framework/exclude-from-idempotency';

import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { IntegrationListItemDto } from './dtos/integration-list-item.dto';
import { SaveCredentialsDto } from './dtos/save-credentials.dto';
import { ListIntegrations } from './usecases/list-integrations/list-integrations.usecase';
import { ListIntegrationsCommand } from './usecases/list-integrations/list-integrations.command';
import { GetAuthUrl } from './usecases/get-auth-url/get-auth-url.usecase';
import { GetAuthUrlCommand } from './usecases/get-auth-url/get-auth-url.command';
import { HandleOAuthCallback } from './usecases/handle-oauth-callback/handle-oauth-callback.usecase';
import { HandleOAuthCallbackCommand } from './usecases/handle-oauth-callback/handle-oauth-callback.command';
import { DisconnectIntegration } from './usecases/disconnect-integration/disconnect-integration.usecase';
import { DisconnectIntegrationCommand } from './usecases/disconnect-integration/disconnect-integration.command';
import { SaveCredentials } from './usecases/save-credentials/save-credentials.usecase';
import { SaveCredentialsCommand } from './usecases/save-credentials/save-credentials.command';
import { HealthCheckIntegration } from './usecases/health-check-integration/health-check-integration.usecase';
import { HealthCheckIntegrationCommand } from './usecases/health-check-integration/health-check-integration.command';
import { HandleRazorpayWebhook } from './usecases/handle-razorpay-webhook/handle-razorpay-webhook.usecase';
import { EnsureRazorpayWebhookToken } from './usecases/ensure-razorpay-webhook-token/ensure-razorpay-webhook-token.usecase';
import { EnsureRazorpayWebhookTokenCommand } from './usecases/ensure-razorpay-webhook-token/ensure-razorpay-webhook-token.command';
import { GetIntegrationCapabilities } from './usecases/get-integration-capabilities/get-integration-capabilities.usecase';
import { GetIntegrationCapabilitiesCommand } from './usecases/get-integration-capabilities/get-integration-capabilities.command';
import { IntegrationCapabilitiesDto } from './dtos/integration-capabilities.dto';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationController {
  private readonly logger = new Logger(IntegrationController.name);
  private readonly allowedRedirectDomains = [
    'localhost',
    '127.0.0.1',
    'rabbithr.co',
    'app.rabbithr.co',
  ];

  constructor(
    private readonly listIntegrations: ListIntegrations,
    private readonly getAuthUrl: GetAuthUrl,
    private readonly handleOAuthCallback: HandleOAuthCallback,
    private readonly disconnectIntegration: DisconnectIntegration,
    private readonly saveCredentials: SaveCredentials,
    private readonly healthCheckIntegration: HealthCheckIntegration,
    private readonly handleRazorpayWebhook: HandleRazorpayWebhook,
    private readonly ensureRazorpayWebhookToken: EnsureRazorpayWebhookToken,
    private readonly getIntegrationCapabilities: GetIntegrationCapabilities,
    private readonly configService: ConfigService,
  ) {}

  private getValidatedFrontendUrl(): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (!frontendUrl) {
      return 'http://localhost:3000';
    }

    try {
      const url = new URL(frontendUrl);
      const hostname = url.hostname.toLowerCase();

      const isAllowed = this.allowedRedirectDomains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );

      if (!isAllowed) {
        this.logger.error(
          `FRONTEND_URL has invalid domain: ${hostname}. Allowed domains: ${this.allowedRedirectDomains.join(', ')}`,
        );
        throw new BadRequestException('Invalid redirect configuration');
      }

      return frontendUrl;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`Invalid FRONTEND_URL format: ${frontendUrl}`);
      throw new BadRequestException('Invalid redirect configuration');
    }
  }

  @Get()
  @RequirePermissions(PERMISSIONS_ENUM.INTEGRATION_LIST_READ)
  @ApiOperation({ summary: 'List all integrations with connection status' })
  @ApiResponse({ status: 200, type: [IntegrationListItemDto] })
  async list(
    @UserSession() user: UserSessionData,
  ): Promise<IntegrationListItemDto[]> {
    return this.listIntegrations.execute(
      ListIntegrationsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Get('capabilities')
  @RequireAuthentication()
  @ApiOperation({
    summary:
      'Which integration powered features are available to the current user',
  })
  @ApiResponse({ status: 200, type: IntegrationCapabilitiesDto })
  async capabilities(
    @UserSession() user: UserSessionData,
  ): Promise<IntegrationCapabilitiesDto> {
    return this.getIntegrationCapabilities.execute(
      GetIntegrationCapabilitiesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post(':provider/connect')
  @RequirePermissions(PERMISSIONS_ENUM.INTEGRATION_CONNECT)
  @ApiOperation({ summary: 'Get OAuth authorization URL for a provider' })
  @ApiResponse({ status: 200 })
  async connect(
    @UserSession() user: UserSessionData,
    @Param('provider') provider: string,
  ): Promise<{ authUrl: string }> {
    return this.getAuthUrl.execute(
      GetAuthUrlCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        provider,
      }),
    );
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle OAuth callback from provider' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Query('accounts-server') accountsServer: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.getValidatedFrontendUrl();
    const callbackPath = '/oauth/callback';

    if (error) {
      res.redirect(
        `${frontendUrl}${callbackPath}?error=${encodeURIComponent(error)}`,
      );
      return;
    }

    try {
      const result = await this.handleOAuthCallback.execute(
        HandleOAuthCallbackCommand.create({ code, state, accountsServer }),
      );

      res.redirect(
        `${frontendUrl}${callbackPath}?success=true&provider=${result.provider}`,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.redirect(
        `${frontendUrl}${callbackPath}?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @Post(':provider/credentials')
  @RequirePermissions(PERMISSIONS_ENUM.INTEGRATION_CONNECT)
  @ApiOperation({
    summary: 'Save API key credentials for an api-key integration',
  })
  @ApiResponse({ status: 200 })
  async credentials(
    @UserSession() user: UserSessionData,
    @Param('provider') provider: string,
    @Body() dto: SaveCredentialsDto,
  ): Promise<{
    status: string;
    errorMessage: string | null;
    webhookToken: string | null;
  }> {
    return this.saveCredentials.execute(
      SaveCredentialsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        provider,
        apiKey: dto.apiKey,
        authId: dto.authId,
        authToken: dto.authToken,
        phoneNumber: dto.phoneNumber,
        webhookSecret: dto.webhookSecret,
      }),
    );
  }

  @Post('razorpay/webhook-token')
  @RequirePermissions(PERMISSIONS_ENUM.INTEGRATION_CONNECT)
  @ApiOperation({
    summary: "Get or create the organization's Razorpay webhook token",
  })
  @ApiResponse({ status: 200 })
  async ensureWebhookToken(
    @UserSession() user: UserSessionData,
  ): Promise<{ webhookToken: string; webhookSecret: string }> {
    return this.ensureRazorpayWebhookToken.execute(
      EnsureRazorpayWebhookTokenCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post('razorpay/webhook/:token')
  @HttpCode(HttpStatus.OK)
  @ExcludeFromIdempotency()
  @ApiOperation({
    summary: "Receive a webhook from an organization's Razorpay",
  })
  @ApiResponse({ status: 200 })
  async razorpayWebhook(
    @Param('token') token: string,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: ExpressRequest & { rawBody?: Buffer },
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
    return this.handleRazorpayWebhook.execute(token, rawBody, signature || '');
  }

  @Post(':provider/health-check')
  @RequirePermissions(PERMISSIONS_ENUM.INTEGRATION_CONNECT)
  @ApiOperation({
    summary: 'Run a health check against the stored credentials',
  })
  @ApiResponse({ status: 200 })
  async healthCheck(
    @UserSession() user: UserSessionData,
    @Param('provider') provider: string,
  ): Promise<{ ok: boolean; status: string; errorMessage: string | null }> {
    return this.healthCheckIntegration.execute(
      HealthCheckIntegrationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        provider,
      }),
    );
  }

  @Delete(':provider')
  @RequirePermissions(PERMISSIONS_ENUM.INTEGRATION_DISCONNECT)
  @ApiOperation({ summary: 'Disconnect an integration' })
  @ApiResponse({ status: 200 })
  async disconnect(
    @UserSession() user: UserSessionData,
    @Param('provider') provider: string,
  ): Promise<void> {
    return this.disconnectIntegration.execute(
      DisconnectIntegrationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        provider,
      }),
    );
  }
}
