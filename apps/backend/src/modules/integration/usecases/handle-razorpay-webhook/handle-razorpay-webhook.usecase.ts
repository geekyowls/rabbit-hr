import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { OrganizationIntegrationRepository } from '@db/repositories';
import { decryptIntegrationData } from '@boilerplate/core';
import type { ApiKeyCredentials } from '../../adapters/api-key-providers';

@Injectable()
export class HandleRazorpayWebhook {
  private readonly logger = new Logger(HandleRazorpayWebhook.name);

  constructor(
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    token: string,
    rawBody: string,
    signature: string,
  ): Promise<{ received: boolean }> {
    const orgIntegration =
      await this.organizationIntegrationRepository.findByWebhookToken(token);

    if (!orgIntegration) {
      throw new NotFoundException('Unknown webhook token');
    }

    const encryptionKey = this.configService.get<string>(
      'INTEGRATION_ENCRYPTION_KEY',
    );

    if (!encryptionKey) {
      throw new BadRequestException('Integration encryption is not configured');
    }

    const credentials = decryptIntegrationData(
      orgIntegration.encryptedTokens,
      encryptionKey,
    ) as ApiKeyCredentials;

    if (!credentials.webhookSecret) {
      throw new BadRequestException('Webhook secret is not configured');
    }

    if (!this.isValidSignature(rawBody, signature, credentials.webhookSecret)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const eventName = this.parseEventName(rawBody);
    this.logger.log(
      `Razorpay webhook "${eventName}" verified for organization ${orgIntegration.organizationId}`,
    );

    orgIntegration.lastSyncAt = new Date();
    await this.organizationIntegrationRepository.save(orgIntegration);

    return { received: true };
  }

  private isValidSignature(
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const received = Buffer.from(signature);
    const computed = Buffer.from(expected);

    return (
      received.length === computed.length &&
      crypto.timingSafeEqual(received, computed)
    );
  }

  private parseEventName(rawBody: string): string {
    try {
      const parsed = JSON.parse(rawBody) as { event?: string };
      return parsed.event ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
}
