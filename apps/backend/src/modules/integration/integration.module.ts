import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { ListIntegrations } from './usecases/list-integrations/list-integrations.usecase';
import { GetAuthUrl } from './usecases/get-auth-url/get-auth-url.usecase';
import { HandleOAuthCallback } from './usecases/handle-oauth-callback/handle-oauth-callback.usecase';
import { DisconnectIntegration } from './usecases/disconnect-integration/disconnect-integration.usecase';
import { SaveCredentials } from './usecases/save-credentials/save-credentials.usecase';
import { HealthCheckIntegration } from './usecases/health-check-integration/health-check-integration.usecase';
import { HandleRazorpayWebhook } from './usecases/handle-razorpay-webhook/handle-razorpay-webhook.usecase';
import { EnsureRazorpayWebhookToken } from './usecases/ensure-razorpay-webhook-token/ensure-razorpay-webhook-token.usecase';

const USE_CASES = [
  ListIntegrations,
  GetAuthUrl,
  HandleOAuthCallback,
  DisconnectIntegration,
  SaveCredentials,
  HealthCheckIntegration,
  HandleRazorpayWebhook,
  EnsureRazorpayWebhookToken,
];

@Module({
  controllers: [IntegrationController],
  providers: [...USE_CASES],
})
export class IntegrationModule {}
