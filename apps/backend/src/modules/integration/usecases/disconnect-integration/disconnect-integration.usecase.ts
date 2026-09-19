import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationIntegrationRepository } from '@db/repositories';
import { OrganizationIntegrationStatus } from '@db/enums';
import { DisconnectIntegrationCommand } from './disconnect-integration.command';

@Injectable()
export class DisconnectIntegration {
  constructor(
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
  ) {}

  async execute(command: DisconnectIntegrationCommand): Promise<void> {
    const orgIntegration =
      await this.organizationIntegrationRepository.findByOrganizationAndProvider(
        command.organizationId,
        command.provider,
      );

    if (!orgIntegration) {
      throw new NotFoundException(
        `Integration "${command.provider}" not found for this organization`,
      );
    }

    orgIntegration.status = OrganizationIntegrationStatus.DISCONNECTED;
    orgIntegration.encryptedTokens = '';
    orgIntegration.tokenExpiresAt = null;
    orgIntegration.errorMessage = null;

    await this.organizationIntegrationRepository.save(orgIntegration);
  }
}
