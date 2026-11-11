import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationIntegrationRepository } from '@db/repositories';
import { findConnectedCredentials } from '@shared/helpers/integration-credentials';
import { IntegrationCapabilitiesService } from '@modules/integration/core/integration-capabilities.service';
import {
  WhatsappCredentials,
  WhatsappProvider,
} from '../providers/whatsapp-provider';
import { WhatsappProviderRegistry } from '../providers/whatsapp-provider.registry';

export interface WhatsappConnection {
  provider: WhatsappProvider;
  credentials: WhatsappCredentials;
}

@Injectable()
export class WhatsappConnectionService {
  constructor(
    private readonly integrations: OrganizationIntegrationRepository,
    private readonly registry: WhatsappProviderRegistry,
    private readonly config: ConfigService,
    private readonly capabilities: IntegrationCapabilitiesService,
  ) {}

  async find(organizationId: string): Promise<WhatsappConnection | null> {
    for (const id of this.registry.ids()) {
      const credentials = await findConnectedCredentials<WhatsappCredentials>(
        this.integrations,
        this.config,
        organizationId,
        id,
      );
      const provider = this.registry.get(id);
      if (credentials && provider) return { provider, credentials };
    }
    return null;
  }

  async require(organizationId: string): Promise<WhatsappConnection> {
    await this.capabilities.require(organizationId, 'whatsapp');
    const connection = await this.find(organizationId);
    if (!connection) {
      throw new ConflictException('WhatsApp is not connected');
    }
    return connection;
  }
}
